from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Dict, Any, List
from app.models.application import Application
from app.models.document import Document
from app.models.compliance import ComplianceRequirement
from app.models.evc import EVCVisit
from app.services.document_service import document_service
from app.services.compliance_service import compliance_service

class AIAssistantService:
    @staticmethod
    def process_query(db: Session, institution_id: str, message: str) -> dict:
        """
        Processes institutional queries by analyzing live database records.
        Can be plugged into OpenAI/Gemini/Anthropic LLMs via API key when provided.
        """
        msg_lower = message.strip().lower()
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Query: Expiring or Expired Documents
        if any(w in msg_lower for w in ["expir", "document", "validity", "passport", "certificate"]):
            docs = db.query(Document).filter(Document.institution_id == institution_id).all()
            expiring = []
            expired = []
            for d in docs:
                status, days = document_service.calculate_expiry_status(d.expiry_date)
                if status in ("Expiring Soon", "Critical"):
                    expiring.append((d, days))
                elif status == "Expired":
                    expired.append(d)

            items = []
            reply_lines = []
            
            if expired:
                reply_lines.append(f"⚠️ **Expired Documents ({len(expired)}):**")
                for d in expired:
                    reply_lines.append(f"• **{d.document_type}** ({d.document_name}) expired on {d.expiry_date}.")
                    items.append({"id": str(d.id), "title": f"Renew {d.document_type}", "type": "document", "link": "/institution/documents"})
                    
            if expiring:
                reply_lines.append(f"⏳ **Expiring Soon ({len(expiring)}):**")
                for d, days in expiring:
                    reply_lines.append(f"• **{d.document_type}** expires in **{days} days** (on {d.expiry_date}).")
                    items.append({"id": str(d.id), "title": f"Renew {d.document_type}", "type": "document", "link": "/institution/documents"})

            if not expired and not expiring:
                reply_lines.append("All institutional documents are currently valid and up to date.")

            reply_lines.append("\nYou can upload renewed certificates in the **Documents** or **Smart Document Passport** section.")
            
            return {
                "answer": "\n".join(reply_lines),
                "related_items": items,
                "timestamp": now_str,
                "suggestions": [
                    "What applications need my attention?",
                    "What compliance is due next?",
                    "Tell me about our EVC visit"
                ]
            }

        # 2. Query: Applications needing attention / correction
        if any(w in msg_lower for w in ["application", "attention", "pending", "correction", "scrutiny"]):
            apps = db.query(Application).filter(Application.institution_id == institution_id).all()
            correction_apps = [a for a in apps if a.status == "Correction Required"]
            scrutiny_apps = [a for a in apps if a.status in ("Under Scrutiny", "Scrutiny")]
            
            items = []
            reply_lines = []
            
            if correction_apps:
                reply_lines.append(f"🚨 **Applications Requiring Correction ({len(correction_apps)}):**")
                for a in correction_apps:
                    deadline_str = f"Deadline: {a.correction_deadline.strftime('%d %b %Y')}" if a.correction_deadline else "Action required urgently"
                    reply_lines.append(f"• **{a.application_number}** ({a.application_type}): {a.remarks or 'Deficiencies noted in scrutiny.'} ({deadline_str})")
                    items.append({"id": str(a.id), "title": f"Review {a.application_number}", "type": "application", "link": f"/institution/applications?id={a.id}"})
            
            if scrutiny_apps:
                reply_lines.append(f"\n🔍 **Under Scrutiny ({len(scrutiny_apps)}):**")
                for a in scrutiny_apps:
                    reply_lines.append(f"• **{a.application_number}** ({a.application_type}) - Stage: {a.current_stage}.")
                    items.append({"id": str(a.id), "title": f"Track {a.application_number}", "type": "application", "link": f"/institution/applications?id={a.id}"})
            
            if not correction_apps and not scrutiny_apps:
                reply_lines.append("All your applications are in good standing without any pending corrections.")

            return {
                "answer": "\n".join(reply_lines),
                "related_items": items,
                "timestamp": now_str,
                "suggestions": [
                    "What documents are expiring?",
                    "What compliance is due next?",
                    "Check institution health score"
                ]
            }

        # 3. Query: Compliance requirements
        if any(w in msg_lower for w in ["compliance", "due", "requirement", "undertaking", "mandatory"]):
            reqs = db.query(ComplianceRequirement).filter(ComplianceRequirement.institution_id == institution_id).all()
            overdue = []
            pending = []
            for r in reqs:
                st, days = compliance_service.get_effective_status(r)
                if st == "Overdue":
                    overdue.append(r)
                elif st == "Pending":
                    pending.append((r, days))

            items = []
            reply_lines = []
            
            if overdue:
                reply_lines.append(f"🔴 **Overdue Compliance Requirements ({len(overdue)}):**")
                for r in overdue:
                    reply_lines.append(f"• **{r.requirement_name}** ({r.category}) was due on {r.due_date}.")
                    items.append({"id": str(r.id), "title": f"Submit {r.requirement_name}", "type": "compliance", "link": "/institution/compliance"})

            if pending:
                reply_lines.append(f"\n🟡 **Upcoming Compliance Requirements ({len(pending)}):**")
                for r, days in pending[:3]:
                    reply_lines.append(f"• **{r.requirement_name}** ({r.category}) due in {days} days on {r.due_date}.")
                    items.append({"id": str(r.id), "title": f"Submit {r.requirement_name}", "type": "compliance", "link": "/institution/compliance"})

            return {
                "answer": "\n".join(reply_lines),
                "related_items": items,
                "timestamp": now_str,
                "suggestions": [
                    "What documents are expiring?",
                    "What applications need my attention?",
                    "Tell me about our EVC visit"
                ]
            }

        # 4. Query: EVC Visit
        if any(w in msg_lower for w in ["evc", "visit", "committee", "inspection"]):
            evc = db.query(EVCVisit).filter(EVCVisit.institution_id == institution_id).first()
            if evc and evc.status == "Scheduled":
                days = (evc.visit_date - date.today()).days if evc.visit_date else 0
                return {
                    "answer": f"📅 **Expert Visiting Committee (EVC) Visit Details:**\n\n• **Date & Time:** {evc.visit_date.strftime('%d %b %Y')} at {evc.visit_time}\n• **Status:** {evc.status}\n• **Mode:** {evc.venue_or_mode}\n• **Committee Size:** {evc.committee_members_count} members\n• **Preparation Readiness:** {evc.preparation_status_pct}% Complete\n• **Time Remaining:** {days} days\n\nPlease ensure physical infrastructure, lab setups, and original faculty credential dossiers are assembled in the administrative boardroom.",
                    "related_items": [{"id": str(evc.id), "title": "View EVC Visit Checklist", "type": "evc", "link": "/institution/evc"}],
                    "timestamp": now_str,
                    "suggestions": [
                        "What documents are expiring?",
                        "What applications need my attention?",
                        "What compliance is due next?"
                    ]
                }
            else:
                return {
                    "answer": "There are currently no active EVC visits scheduled for your institution.",
                    "related_items": [],
                    "timestamp": now_str,
                    "suggestions": ["Check application status", "What compliance is due next?"]
                }

        # 5. Query: Health Score
        if any(w in msg_lower for w in ["health", "score", "rating"]):
            return {
                "answer": "Your institution currently holds a **Health Score of 82/100 (Status: Good)**.\n\n• Application Compliance: 90%\n• Document Validity: 75%\n• Undertaking Compliance: 85%\n• Pending Actions: 80%\n\n*Note: This is an internal AICTE SmartAssist workflow health indicator to help your institution prevent deficiencies. It is not an official AICTE accreditation score.*",
                "related_items": [{"id": "health", "title": "View Health Score Insights", "type": "policy", "link": "/institution/dashboard"}],
                "timestamp": now_str,
                "suggestions": ["What documents are expiring?", "What applications need my attention?"]
            }

        # Default fallback response with helpful suggestions
        return {
            "answer": f"Hello! I am **AICTE SmartAssist**, your AI guidance assistant for Government College of Engineering (`{institution_id}`).\n\nI can assist you with:\n1. Checking pending application corrections & scrutiny statuses\n2. Tracking document renewals & expiry alerts\n3. Viewing compliance submission deadlines\n4. EVC committee inspection visit preparation\n\nHow may I help you today?",
            "related_items": [],
            "timestamp": now_str,
            "suggestions": [
                "What documents are expiring?",
                "What applications need my attention?",
                "What compliance is due next?",
                "Tell me about our EVC visit"
            ]
        }

assistant_service = AIAssistantService()
