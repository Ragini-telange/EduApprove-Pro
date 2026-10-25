from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.institution import Institution
from app.models.application import Application
from app.models.document import Document
from app.models.compliance import ComplianceRequirement
from app.models.evc import EVCVisit
from app.models.notification import Notification
from app.models.alert import Alert

def seed_database(db: Session):
    # Check if institution already exists
    existing = db.query(Institution).filter(Institution.id == "AICTE-INS-10245").first()
    if existing:
        return

    print("Seeding database for Government College of Engineering (AICTE-INS-10245)...")

    # 1. Institution
    inst = Institution(
        id="AICTE-INS-10245",
        name="Government College of Engineering",
        code="GCE-PUN-01",
        category="Engineering & Technology",
        institution_type="Government",
        email="principal@gcepune.ac.in",
        phone="+91 20 2550 7000",
        address="Wellesley Road, Shivajinagar",
        state="Maharashtra",
        district="Pune",
        pincode="411005",
        establishment_year=1954,
        approval_status="Approved",
        current_academic_year="2026-2027",
        is_active=True
    )
    db.add(inst)
    db.flush()

    # 2. Applications (Total: 12)
    # Distribution: Draft: 2, Submitted: 2, Under Scrutiny: 4, Correction Required: 2, EVC: 1, Completed: 1 (Total: 12)
    today = date.today()
    
    apps_data = [
        # Scrutiny (4)
        {
            "application_number": "APP-2026-1024",
            "application_type": "New Institution",
            "status": "Under Scrutiny",
            "current_stage": "Scrutiny",
            "submitted_at": datetime(2026, 10, 18, 11, 30),
            "remarks": "Documents under active review by Regional Scrutiny Committee."
        },
        {
            "application_number": "APP-2026-1021",
            "application_type": "Extension of Approval",
            "status": "Under Scrutiny",
            "current_stage": "Scrutiny",
            "submitted_at": datetime(2026, 10, 16, 14, 0),
            "remarks": "Preliminary verification completed. Awaiting member review."
        },
        {
            "application_number": "APP-2026-1015",
            "application_type": "Introduction of Supernumerary Seats",
            "status": "Under Scrutiny",
            "current_stage": "Scrutiny",
            "submitted_at": datetime(2026, 10, 12, 10, 15),
            "remarks": "Scrutiny of AI/DS seat quota in progress."
        },
        {
            "application_number": "APP-2026-1012",
            "application_type": "Conversion of Diploma to Degree",
            "status": "Under Scrutiny",
            "current_stage": "Scrutiny",
            "submitted_at": datetime(2026, 10, 11, 16, 45),
            "remarks": "Curriculum and lab facilities mapping under review."
        },
        # Correction Required (2)
        {
            "application_number": "APP-2026-1019",
            "application_type": "Course Extension",
            "status": "Correction Required",
            "current_stage": "Document Verification",
            "submitted_at": datetime(2026, 10, 15, 9, 30),
            "correction_deadline": datetime.utcnow() + timedelta(days=5),
            "remarks": "Discrepancy detected in Faculty Cadre Ratio for Mechanical Department. Upload revised endorsement."
        },
        {
            "application_number": "APP-2026-1016",
            "application_type": "Closure of Program",
            "status": "Correction Required",
            "current_stage": "Document Verification",
            "submitted_at": datetime(2026, 10, 14, 15, 20),
            "correction_deadline": datetime.utcnow() + timedelta(days=8),
            "remarks": "No-Objection Certificate from affiliating university requires stamp clarity."
        },
        # EVC (1)
        {
            "application_number": "APP-2026-1008",
            "application_type": "Increase in Intake",
            "status": "EVC",
            "current_stage": "EVC",
            "submitted_at": datetime(2026, 10, 10, 12, 0),
            "remarks": "EVC inspection team scheduled for physical verification on 20 Nov 2026."
        },
        # Submitted (2)
        {
            "application_number": "APP-2026-1025",
            "application_type": "Introduction of New Course (Robotics)",
            "status": "Submitted",
            "current_stage": "Queue for Scrutiny",
            "submitted_at": datetime(2026, 10, 19, 10, 0),
            "remarks": "Application submitted successfully. Waiting for committee assignment."
        },
        {
            "application_number": "APP-2026-1023",
            "application_type": "Change of Name of Institution",
            "status": "Submitted",
            "current_stage": "Queue for Scrutiny",
            "submitted_at": datetime(2026, 10, 17, 13, 10),
            "remarks": "Gazette notification attached. Pending officer assignment."
        },
        # Completed (1)
        {
            "application_number": "APP-2026-1002",
            "application_type": "Extension of Approval (AY 2025-26)",
            "status": "Completed",
            "current_stage": "Approved",
            "submitted_at": datetime(2026, 8, 1, 9, 0),
            "remarks": "EOA issued for all 8 engineering disciplines."
        },
        # Draft (2)
        {
            "application_number": "APP-2026-1027",
            "application_type": "Collaborative Program with Foreign University",
            "status": "Draft",
            "current_stage": "Draft Preparation",
            "submitted_at": None,
            "remarks": "Draft created. MoU document awaiting governing council signoff."
        },
        {
            "application_number": "APP-2026-1028",
            "application_type": "Establishment of Incubation Center",
            "status": "Draft",
            "current_stage": "Draft Preparation",
            "submitted_at": None,
            "remarks": "Draft created. Financial viability report being finalized."
        }
    ]

    created_apps = []
    for item in apps_data:
        app = Application(
            institution_id=inst.id,
            application_number=item["application_number"],
            application_type=item["application_type"],
            academic_year="2026-2027",
            status=item["status"],
            current_stage=item["current_stage"],
            submitted_at=item["submitted_at"],
            correction_deadline=item.get("correction_deadline"),
            remarks=item.get("remarks")
        )
        db.add(app)
        created_apps.append(app)
    db.flush()

    # Find the EVC application
    evc_app = next((a for a in created_apps if a.application_number == "APP-2026-1008"), None)

    # 3. Documents
    # Real AICTE institutional documents
    # Current date in simulation context: late October 2026
    # Lease Agreement: Expiry in 12 days -> 2026-11-03 or 2026-11-12
    # Building Completion: 20 Aug 2028 (Valid)
    # Fire Safety: Verification Pending / Expired
    # Affiliation: Expired 05 Oct 2026
    docs_data = [
        {
            "document_type": "Lease Agreement",
            "document_name": "Land_Lease_Agreement_Campus_2026.pdf",
            "file_path": "uploads/AICTE-INS-10245/lease_agreement.pdf",
            "file_url": "/api/institution/documents/download/1",
            "expiry_date": today + timedelta(days=12), # Expiring in 12 days
            "verification_status": "Verified",
            "verified_by": "Regional Scrutiny Committee",
            "file_size_kb": 2450,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Building Completion Certificate",
            "document_name": "Building_Completion_Cert_PWD.pdf",
            "file_path": "uploads/AICTE-INS-10245/building_completion.pdf",
            "file_url": "/api/institution/documents/download/2",
            "expiry_date": date(2028, 8, 20), # Valid
            "verification_status": "Verified",
            "verified_by": "Chief Engineer PWD",
            "file_size_kb": 3890,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Fire Safety Certificate",
            "document_name": "Fire_Safety_NOC_Pune_Municipal.pdf",
            "file_path": "uploads/AICTE-INS-10245/fire_safety.pdf",
            "file_url": "/api/institution/documents/download/3",
            "expiry_date": today - timedelta(days=5), # Expired 5 days ago! Critical alert
            "verification_status": "Expired",
            "verified_by": "Chief Fire Officer",
            "file_size_kb": 1420,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Affiliation Certificate",
            "document_name": "SPPU_University_Affiliation_2026.pdf",
            "file_path": "uploads/AICTE-INS-10245/affiliation_cert.pdf",
            "file_url": "/api/institution/documents/download/4",
            "expiry_date": date(2026, 10, 5), # Expired 05 Oct 2026
            "verification_status": "Expired",
            "verified_by": "University Registrar",
            "file_size_kb": 1820,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Land Ownership Document",
            "document_name": "Govt_Revenue_Land_Title_Sanad.pdf",
            "file_path": "uploads/AICTE-INS-10245/land_ownership.pdf",
            "file_url": "/api/institution/documents/download/5",
            "expiry_date": None, # Permanent
            "verification_status": "Verified",
            "verified_by": "District Collector",
            "file_size_kb": 5120,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Infrastructure Certificate",
            "document_name": "Barrier_Free_Access_Audit_Report.pdf",
            "file_path": "uploads/AICTE-INS-10245/infrastructure.pdf",
            "file_url": "/api/institution/documents/download/6",
            "expiry_date": today + timedelta(days=180),
            "verification_status": "Verified",
            "verified_by": "AICTE Structural Empaneled Auditor",
            "file_size_kb": 3200,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Faculty Related Documents",
            "document_name": "Faculty_Cadre_PayScale_Compliance.pdf",
            "file_path": "uploads/AICTE-INS-10245/faculty_docs.pdf",
            "file_url": "/api/institution/documents/download/7",
            "expiry_date": today + timedelta(days=25), # Expiring soon
            "verification_status": "Verification Pending",
            "verified_by": None,
            "file_size_kb": 4350,
            "mime_type": "application/pdf"
        },
        {
            "document_type": "Anti-Ragging Committee Notification",
            "document_name": "Anti_Ragging_Squad_Constitution_2026.pdf",
            "file_path": "uploads/AICTE-INS-10245/anti_ragging.pdf",
            "file_url": "/api/institution/documents/download/8",
            "expiry_date": date(2027, 6, 30),
            "verification_status": "Verified",
            "verified_by": "Dean Student Affairs",
            "file_size_kb": 890,
            "mime_type": "application/pdf"
        }
    ]

    for d in docs_data:
        doc = Document(
            institution_id=inst.id,
            document_type=d["document_type"],
            document_name=d["document_name"],
            file_path=d["file_path"],
            file_url=d["file_url"],
            expiry_date=d["expiry_date"],
            verification_status=d["verification_status"],
            verified_by=d.get("verified_by"),
            verified_at=datetime.utcnow() - timedelta(days=30) if d.get("verified_by") else None,
            file_size_kb=d["file_size_kb"],
            mime_type=d["mime_type"]
        )
        db.add(doc)
    db.flush()

    # 4. Compliance Requirements
    # Total 10 requirements: 8 Completed, 1 Pending (due in 7 days), 1 Overdue
    comp_data = [
        {"name": "Faculty-to-Student Ratio Verification", "cat": "Faculty", "due": today - timedelta(days=60), "status": "Verified"},
        {"name": "Digital Library National Subscription (NDLI)", "cat": "Academic", "due": today - timedelta(days=45), "status": "Verified"},
        {"name": "Women Internal Complaints Committee (ICC) Setup", "cat": "Governance", "due": today - timedelta(days=30), "status": "Verified"},
        {"name": "Barrier Free Accessibility / Ramp Certificate", "cat": "Infrastructure", "due": today - timedelta(days=20), "status": "Verified"},
        {"name": "Anti-Ragging Affidavits 100% Submission", "cat": "Governance", "due": today - timedelta(days=15), "status": "Verified"},
        {"name": "Student Grievance Redressal Portal Activation", "cat": "Governance", "due": today - timedelta(days=10), "status": "Verified"},
        {"name": "AICTE Approval Fee Challan Remittance", "cat": "Finance", "due": today - timedelta(days=5), "status": "Verified"},
        {"name": "Laboratories Equipment Calibrated Audit", "cat": "Infrastructure", "due": today - timedelta(days=2), "status": "Submitted"},
        # 1 Pending (Due in 7 days)
        {"name": "Industry-Academia MoU Endorsement", "cat": "Academic", "due": today + timedelta(days=7), "status": "Pending"},
        # 1 Overdue (Due 3 days ago)
        {"name": "Mandatory Biometric Attendance Sync with AICTE", "cat": "Governance", "due": today - timedelta(days=3), "status": "Pending"}
    ]

    for c in comp_data:
        req = ComplianceRequirement(
            institution_id=inst.id,
            requirement_name=c["name"],
            category=c["cat"],
            description=f"AICTE mandatory compliance under Handbook regulations for {c['cat']}.",
            due_date=c["due"],
            status=c["status"],
            submitted_at=datetime.utcnow() - timedelta(days=10) if c["status"] in ("Verified", "Submitted") else None,
            verified_at=datetime.utcnow() - timedelta(days=2) if c["status"] == "Verified" else None
        )
        db.add(req)
    db.flush()

    # 5. EVC Visit
    evc = EVCVisit(
        institution_id=inst.id,
        application_id=evc_app.id if evc_app else None,
        visit_date=date(2026, 11, 20),
        visit_time="10:30 AM",
        visit_type="Committee Visit",
        status="Scheduled",
        committee_members_count=3,
        preparation_status_pct=75,
        venue_or_mode="On-site Inspection",
        contact_person="Dr. R. K. Sharma (Dean Academics)",
        remarks="Committee members: Prof. P. V. Rao (IIT Delhi), Dr. Sunita Kulkarni (COEP), Er. M. N. Deshmukh (PWD)."
    )
    db.add(evc)

    # 6. Notifications
    notifs_data = [
        {
            "title": "Correction Required",
            "message": "Application APP-2026-1019 requires correction. Please verify faculty cadre documents.",
            "type": "Correction Required",
            "severity": "critical",
            "is_read": False,
            "rel_type": "application",
            "rel_id": "APP-2026-1019"
        },
        {
            "title": "Document Expiring",
            "message": "Lease Agreement expires in 12 days. Submit renewal to avoid compliance violation.",
            "type": "Document Expiring",
            "severity": "warning",
            "is_read": False,
            "rel_type": "document",
            "rel_id": "Lease Agreement"
        },
        {
            "title": "Application Updated",
            "message": "APP-2026-1024 has successfully moved to Scrutiny stage.",
            "type": "Application Updated",
            "severity": "info",
            "is_read": True,
            "rel_type": "application",
            "rel_id": "APP-2026-1024"
        },
        {
            "title": "EVC Visit Scheduled",
            "message": "Expert Visiting Committee (EVC) has confirmed physical visit on 20 Nov 2026 at 10:30 AM.",
            "type": "EVC Scheduled",
            "severity": "info",
            "is_read": False,
            "rel_type": "evc",
            "rel_id": "EVC-2026"
        }
    ]

    for n in notifs_data:
        notif = Notification(
            institution_id=inst.id,
            title=n["title"],
            message=n["message"],
            notification_type=n["type"],
            severity=n["severity"],
            is_read=n["is_read"],
            related_entity_type=n["rel_type"],
            related_entity_id=n["rel_id"]
        )
        db.add(notif)

    # 7. Alerts (Smart Alert Center)
    alerts_data = [
        {
            "title": "Fire Safety Certificate expired",
            "description": "Certificate expired 5 days ago. Non-compliance may lead to provisional suspension of seat approvals.",
            "severity": "Critical",
            "category": "Document",
            "action_url": "/institution/documents?type=Fire%20Safety%20Certificate",
            "action_label": "Renew Certificate"
        },
        {
            "title": "Lease expires in 12 days",
            "description": "Campus land lease renewal agreement is due on 03 Nov 2026.",
            "severity": "High Priority",
            "category": "Document",
            "action_url": "/institution/documents?type=Lease%20Agreement",
            "action_label": "Upload Renewal"
        },
        {
            "title": "Compliance due in 7 days",
            "description": "Industry-Academia MoU Endorsement submission deadline is approaching.",
            "severity": "Upcoming",
            "category": "Compliance",
            "action_url": "/institution/compliance",
            "action_label": "Submit Compliance"
        }
    ]

    for a in alerts_data:
        alert = Alert(
            institution_id=inst.id,
            title=a["title"],
            description=a["description"],
            severity=a["severity"],
            category=a["category"],
            action_url=a["action_url"],
            action_label=a["action_label"]
        )
        db.add(alert)

    db.commit()
    print("Database seeding completed successfully!")
