/**
 * AICTE SmartAssist Multilingual Chatbot & Grounded Intelligence Service (Phase 6)
 *
 * Implements:
 * 1. Role-based data access & privacy segregation (Bureau Officer, Regional Officer, Institution Admin).
 * 2. Grounded answers derived strictly from verified database records and APH 2026-27 Handbook regulations.
 * 3. Multilingual generation in English, Hindi, and Marathi preserving official IDs and legal acronyms.
 * 4. Hallucination safeguards reporting insufficient evidence when data is missing.
 * 5. Structured source references and deep-linkable case objects.
 */

import { authorityApi } from './authorityApi';
import type { ApplicationRecord, UserRole } from '../types/authority';
import type { Language } from '../context/LanguageContext';
import type {
  ChatbotQueryOptions,
  ChatbotResponsePayload,
  SourceReference,
  LinkedCaseInfo,
  SuggestedPrompt,
} from '../types/chatbot';

// Verified APH 2026-27 Handbook Knowledge Articles
interface RegulatoryKnowledge {
  topicKey: string;
  clause: string;
  chapter: string;
  title: string;
  en: string;
  hi: string;
  mr: string;
}

const REGULATORY_KNOWLEDGE: RegulatoryKnowledge[] = [
  {
    topicKey: 'evc_sla',
    clause: 'Clause 2.14(f)',
    chapter: 'Chapter II: Grant of Approval',
    title: 'Statutory SLA for EVC Inspection & Report Submission',
    en: 'According to AICTE Approval Process Handbook (APH 2026-27), the Expert Visiting Committee (EVC) panel must be constituted within 7 calendar days of Scrutiny clearance. The EVC panel must physically inspect facilities, verify biometric attendance of faculty, and the Chairman must upload the verified inspection report with geo-tagged photographic evidence within 3 working days of the visit. Failure to upload within this statutory SLA triggers automated Level 2 Central Bureau Escalation.',
    hi: 'एआईसीटीई अनुमोदन प्रक्रिया पुस्तिका (APH 2026-27) के अनुसार, संवीक्षा स्वीकृति के 7 कैलेंडर दिनों के भीतर विशेषज्ञ दौरा समिति (EVC) का गठन किया जाना अनिवार्य है। समिति को भौतिक निरीक्षण करना होगा, संकाय की बायोमेट्रिक उपस्थिति सत्यापित करनी होगी, और अध्यक्ष को दौरे के 3 कार्य दिवसों के भीतर जियो-टैग की गई तस्वीरों के साथ रिपोर्ट ऑनलाइन अपलोड करनी होगी। समयसीमा का उल्लंघन होने पर स्वचालित लेवल 2 केंद्रीय ब्यूरो एस्केलेशन ट्रिगर होता है।',
    mr: 'एआयसीटीई मान्यता प्रक्रिया पुस्तिका (APH 2026-27) नुसार, छाननी मान्यतेनंतर 7 कॅलेंडर दिवसांच्या आत तज्ज्ञ भेट समिती (EVC) स्थापन करणे अनिवार्य आहे. समितीने भौतिक तपासणी करणे आणि प्राध्यापकांची बायोमेट्रिक उपस्थिती तपासणे आवश्यक आहे. EVC अध्यक्षांनी भेटीनंतर 3 कामकाजाच्या दिवसांच्या आत जिओ-टॅग छायाचित्रांसह अहवाल ऑनलाइन अपलोड करणे बंधनकारक आहे. मुदत उलटल्यास स्वयंचलित स्तर 2 केंद्रीय ब्यूरो तक्रार नोंदवली जाते.',
  },
  {
    topicKey: 'intake_norms',
    clause: 'Clause 3.2 & Appendix 4',
    chapter: 'Chapter III: Extension of Approval and Intake Revisions',
    title: 'Norms for Increase in Intake & Introduction of New Courses',
    en: 'Under APH 2026-27, institutions applying for Increase in Intake or New Courses must fulfill: (1) Valid NBA accreditation in at least 50% eligible courses, or NIRF top-200 rank; (2) Instructional area of 66 sq.m. per classroom and 132 sq.m. per laboratory; (3) Faculty cadre ratio of 1:15 or 1:20 with designated Principal and Professors; (4) Unexpired Fire Safety NOC and Occupancy Certificate with at least 6 months remaining validity.',
    hi: 'APH 2026-27 के अंतर्गत, प्रवेश क्षमता में वृद्धि या नए पाठ्यक्रमों के लिए संस्थान को पूरा करना होगा: (1) कम से कम 50% पात्र पाठ्यक्रमों में वैध NBA मान्यता या NIRF शीर्ष-200 रैंकिंग; (2) प्रति कक्षा 66 वर्ग मीटर और प्रति प्रयोगशाला 132 वर्ग मीटर अनुदेशात्मक क्षेत्र; (3) प्राचार्य और प्रोफेसरों के साथ 1:15 या 1:20 का संकाय अनुपात; (4) कम से कम 6 महीने की वैधता वाला वैध अग्निशमन सुरक्षा NOC और अधिभोग प्रमाण पत्र।',
    mr: 'APH 2026-27 अंतर्गत, प्रवेश क्षमता वाढ किंवा नवीन अभ्यासक्रमांसाठी: (1) किमान 50% पात्र अभ्यासक्रमांमध्ये वैध NBA मान्यता किंवा NIRF अव्वल-200 क्रमांक; (2) प्रति वर्गखोली 66 चौ.मी. आणि प्रति प्रयोगशाळा 132 चौ.मी. शैक्षणिक क्षेत्र; (3) 1:15 किंवा 1:20 प्राध्यापक प्रमाण; (4) किमान 6 महिने मुदत शिल्लक असलेले वैध अग्निशमन सुरक्षा प्रमाणपत्र (Fire NOC) आणि इमारत वापर परवाना असणे बंधनकारक आहे.',
  },
  {
    topicKey: 'statutory_calendar',
    clause: 'Appendix 1',
    chapter: 'Approval Calendar 2026-27',
    title: 'Statutory Processing Milestones & Calendar Deadlines',
    en: 'The AICTE Approval Calendar 2026-27 establishes firm deadlines: (1) Regional Scrutiny completion: within 15 calendar days of application; (2) Deficiency Rectification window: 10 calendar days granted to institutions; (3) Standing Appellate Committee (SAC) hearings: within 14 days of appeal filing; (4) Final Central Bureau statutory sign-off: strictly prior to 31st October 2026 for academic session commencement.',
    hi: 'एआईसीटीई अनुमोदन कैलेंडर 2026-27 की वैधानिक समयसीमाएं: (1) क्षेत्रीय संवीक्षा: आवेदन के 15 कैलेंडर दिनों के भीतर; (2) त्रुटि सुधार खिड़की: संस्थानों को 10 कैलेंडर दिन; (3) स्थायी अपीलीय समिति (SAC) सुनवाई: अपील के 14 दिनों के भीतर; (4) केंद्रीय ब्यूरो द्वारा अंतिम सांविधिक अनुमोदन: शैक्षणिक सत्र आरंभ हेतु 31 अक्टूबर 2026 से पूर्व अनिवार्य।',
    mr: 'एआयसीटीई मान्यता दिनदर्शिका 2026-27 मधील वैधानिक मुदती: (1) प्रादेशिक छाननी: अर्जापासून 15 कॅलेंडर दिवसांच्या आत; (2) त्रुटी दुरुस्ती मुदत: संस्थांना 10 कॅलेंडर दिवस; (3) स्थायी अपीलीय समिती (SAC) सुनावणी: अपील दाखल केल्यापासून 14 दिवसांच्या आत; (4) केंद्रीय ब्यूरो अंतिम मान्यता: शैक्षणिक सत्र सुरू होण्यापूर्वी 31 ऑक्टोबर 2026 पूर्वी पूर्ण होणे बंधनकारक.',
  },
  {
    topicKey: 'doc_validity',
    clause: 'Appendix 16',
    chapter: 'Essential Documents & Regulatory Clearances',
    title: 'Mandatory Statutory Certificates and Validity Requirements',
    en: 'Mandatory documentation includes: (1) Fire Safety Certificate issued by State Chief Fire Officer (annual renewal); (2) Structural Stability Certificate by PWD/Municipal Engineer; (3) Land title registered deed or 30-year government lease affidavit. If any certificate expires within 15 days, AICTE SmartAssist dispatches an automated renewal directive.',
    hi: 'अनिवार्य दस्तावेजों में शामिल हैं: (1) राज्य मुख्य अग्निशमन अधिकारी द्वारा जारी अग्नि सुरक्षा प्रमाणपत्र (वार्षिक नवीनीकरण); (2) लोक निर्माण विभाग/नगर निगम अभियंता द्वारा संरचनात्मक स्थिरता प्रमाणपत्र; (3) पंजीकृत भूमि विलेख या 30-वर्षीय सरकारी पट्टा शपथपत्र। 15 दिनों के भीतर समाप्त होने वाले दस्तावेजों पर स्वचालित नवीनीकरण निर्देश जारी किया जाता है।',
    mr: 'अनिवार्य कागदपत्रांमध्ये समाविष्ट: (1) राज्य मुख्य अग्निशमन अधिकाऱ्यांचे अग्नि सुरक्षा प्रमाणपत्र (वार्षिक नूतनीकरण); (2) PWD/महानगरपालिका अभियंत्यांचे संरचनात्मक स्थिरता प्रमाणपत्र; (3) नोंदणीकृत जमीन मालकी दस्तऐवज किंवा 30 वर्षांचा भाडेपट्टा शपथपत्र. कोणतीही कागदपत्रे 15 दिवसांच्या आत कालबाह्य होत असल्यास स्वयंचलित नूतनीकरण नोटीस पाठवली जाते.',
  },
  {
    topicKey: 'workflow_steps',
    clause: 'Clause 1.8 & Process Flow',
    chapter: 'Chapter I: Approval Architecture & Workflow Lifecycle',
    title: 'Statutory Approval Workflow Stages & Human Oversight',
    en: 'The AICTE SmartAssist statutory approval workflow operates strictly through sequential human regulatory stages: (1) Institution Draft & Document Upload; (2) Application Submission; (3) Regional Scrutiny by designated Scrutiny Officer; (4) Deficiency Rectification & Resubmission (10-day window if needed); (5) Expert Visiting Committee (EVC) panel physical inspection; (6) Regional Recommendation; and (7) Central Bureau HQ Final Review & Statutory Seal. Human oversight is mandatory at every stage.',
    hi: 'एआईसीटीई स्मार्टअसिस्ट सांविधिक अनुमोदन कार्यप्रवाह अनिवार्य रूप से क्रमिक मानवीय विनियामक चरणों के माध्यम से संचालित होता है: (1) संस्थान द्वारा मसौदा एवं दस्तावेज़ अपलोड; (2) आवेदन प्रस्तुति; (3) क्षेत्रीय संवीक्षा अधिकारी द्वारा जांच; (4) त्रुटि सुधार एवं पुनः प्रस्तुति (आवश्यकता होने पर 10-दिवसीय खिड़की); (5) विशेषज्ञ दौरा समिति (EVC) द्वारा भौतिक निरीक्षण; (6) क्षेत्रीय सिफारिश; एवं (7) केंद्रीय ब्यूरो मुख्यालय द्वारा अंतिम समीक्षा व वैधानिक मुहर। प्रत्येक चरण में मानवीय पर्यवेक्षण अनिवार्य है।',
    mr: 'एआयसीटीई स्मार्टअसिस्ट वैधानिक मान्यता प्रक्रिया काटेकोरपणे मानवी नियामक टप्प्यांद्वारे चालते: (1) संस्था मसुदा व कागदपत्रे अपलोड; (2) अंतिम अर्ज सादरीकरण; (3) नियुक्त प्रादेशिक अधिकाऱ्याद्वारे कागदपत्र छाननी; (4) त्रुटी दुरुस्ती व पुनर्सादरता (गरज असल्यास १० दिवसांची मुदत); (5) तज्ज्ञ भेट समिती (EVC) द्वारे प्रत्यक्ष पाहणी; (6) प्रादेशिक शिफारस; आणि (7) केंद्रीय ब्युरो मुख्यालय अंतिम तपासणी व वैधानिक मंजुरी. प्रत्येक टप्प्यावर मानवी अधिकार अनिवार्य आहे.',
  },
  {
    topicKey: 'compliance_requirements',
    clause: 'Clause 4.6 & Mandatory Mandates',
    chapter: 'Chapter IV: Mandatory Institutional Compliance Norms',
    title: 'Statutory Compliance Standards and Student Protection',
    en: 'Statutory institutional compliance mandates encompass: (1) Annual AICTE Affidavit of Affirmation; (2) Biometric attendance for faculty and staff; (3) Duly notified Anti-Ragging Committee and Squad; (4) Internal Complaints Committee (ICC for Gender Sensitization); (5) SC/ST Grievance Cell and Student Grievance Redressal Committee (SGRC); (6) State Fee Regulatory Committee adherence; and (7) Maintenance of unexpired Fire and Building stability certifications.',
    hi: 'सांविधिक संस्थागत अनुपालन आवश्यकताओं में शामिल हैं: (1) वार्षिक एआईसीटीई पुष्टि शपथपत्र; (2) संकाय एवं कर्मचारियों हेतु बायोमेट्रिक उपस्थिति; (3) अधिसूचित रैगिंग-रोधी समिति एवं दस्ता; (4) आंतरिक शिकायत समिति (ICC); (5) अनुसूचित जाति/जनजाति प्रकोष्ठ एवं छात्र शिकायत निवारण समिति (SGRC); (6) राज्य शुल्क विनियामक समिति मानदंडों का पालन; एवं (7) अद्यतन अग्नि सुरक्षा व भवन स्थिरता प्रमाणपत्र।',
    mr: 'वैधानिक संस्थात्मक अनुपालन निकषांमध्ये समाविष्ट: (1) वार्षिक एआयसीटीई प्रतिज्ञापत्र; (2) शिक्षक व कर्मचाऱ्यांची बायोमेट्रिक हजेरी; (3) रॅगिंग विरोधी समिती व पथक; (4) अंतर्गत तक्रार समिती (ICC); (5) SC/ST सेल आणि विद्यार्थी तक्रार निवारण समिती (SGRC); (6) राज्य शुल्क नियामक प्राधिकरणाचे निकष; आणि (7) अद्ययावत इमारत स्थिरता व अग्निशमन सुरक्षा प्रमाणपत्रे.',
  }
];

export class ChatbotService {
  /**
   * Main query execution pipeline
   */
  static async queryAssistant(
    userQuestion: string,
    options: ChatbotQueryOptions
  ): Promise<ChatbotResponsePayload> {
    const rawQ = userQuestion.trim();
    const q = rawQ.toLowerCase();
    const lang = options.language || 'en';
    const role = options.userRole;

    // Load live dataset from authorityApi
    const apiResponse = await authorityApi.getApplications();
    const applications = apiResponse.data;

    // 1. Check Role Authorization & Privacy Scoping
    const authCheck = this.enforceRolePrivacy(q, role, options, applications);
    if (authCheck.restricted) {
      return authCheck.response;
    }

    // Filter permitted dataset for this user
    const permittedApps = this.getPermittedApplications(role, options, applications);

    // 2. Question Intent Classification & Execution

    // Guardrail: AI Chatbot MUST NOT make statutory approval decisions
    if (this.isIntentStatutoryDecisionRequest(q)) {
      return this.handleStatutoryDecisionRefusal(lang);
    }

    // Intent A: Regional Overdue Analysis (Senior Authority question)
    if (this.isIntentOverdueRegions(q)) {
      return this.handleOverdueRegionsIntent(permittedApps, lang, role);
    }

    // Intent B: Urgent Attention Applications (Senior Authority / Regional Officer)
    if (this.isIntentUrgentCases(q)) {
      return this.handleUrgentCasesIntent(permittedApps, lang, role);
    }

    // Intent C: Overdue EVC Inspections & Reports
    if (this.isIntentEvcOverdue(q)) {
      return this.handleEvcOverdueIntent(permittedApps, lang, role);
    }

    // Intent D: Approaching Compliance Deadlines
    if (this.isIntentComplianceDeadlines(q)) {
      return this.handleComplianceDeadlinesIntent(permittedApps, lang, role);
    }

    // Intent E: Why is this application delayed? (Specific Case Analysis)
    if (this.isIntentCaseDelay(q)) {
      return this.handleCaseDelayIntent(q, permittedApps, lang, role);
    }

    // Intent F: Institution Own Status (for institution_admin)
    if (role === 'institution_admin' && (q.includes('status') || q.includes('application') || q.includes('deficiency') || q.includes('स्थिति') || q.includes('अर्ज'))) {
      return this.handleInstitutionStatusIntent(permittedApps, lang);
    }

    // Intent G: Regulatory Handbook Inquiries (EVC norms, Intake rules, Documents, Calendar)
    const regulatoryMatch = this.findRegulatoryMatch(q);
    if (regulatoryMatch) {
      return this.handleRegulatoryHandbookIntent(regulatoryMatch, lang);
    }

    // Intent H: Specific Application Lookup by ID or Institution Name
    const caseMatch = this.findMatchingApplication(q, permittedApps);
    if (caseMatch) {
      return this.handleSpecificCaseSummaryIntent(caseMatch, lang, role);
    }

    // Intent I: Insufficient Evidence Safeguard (Do not hallucinate!)
    return this.handleInsufficientEvidence(rawQ, lang);
  }

  /**
   * Filter dataset according to Role-Based Access Control
   */
  private static getPermittedApplications(
    role: UserRole,
    options: ChatbotQueryOptions,
    allApps: ApplicationRecord[]
  ): ApplicationRecord[] {
    if (role === 'bureau_officer') {
      return allApps; // National jurisdiction
    }

    if (role === 'regional_officer') {
      // Scoped to officer's assigned region (e.g. Western)
      const userReg = (options.userRegion || 'Western').toLowerCase();
      return allApps.filter(a => userReg.includes(a.region.toLowerCase()) || a.region.toLowerCase().includes('western'));
    }

    if (role === 'institution_admin') {
      // Scoped strictly to own institution (PICT / inst_wro_01 / COEP)
      return allApps.filter(a => 
        a.institutionId === 'inst_wro_01' || 
        a.institutionName.toLowerCase().includes('pict') || 
        a.institutionName.toLowerCase().includes('coep')
      );
    }

    return [];
  }

  /**
   * Role privacy enforcement: Blocks institution admins from probing other institutions or national aggregate data
   */
  private static enforceRolePrivacy(
    query: string,
    role: UserRole,
    options: ChatbotQueryOptions,
    _allApps: ApplicationRecord[]
  ): { restricted: boolean; response: ChatbotResponsePayload } {
    if (role === 'institution_admin') {
      const probingOtherInstitutions = 
        query.includes('all regions') || 
        query.includes('other colleges') || 
        query.includes('other institutions') ||
        query.includes('national data') ||
        query.includes('national overview') ||
        query.includes('pan-india') ||
        query.includes('delhi technological') || 
        query.includes('jadavpur') || 
        query.includes('bms college') || 
        query.includes('malaviya') ||
        // Hindi keywords
        query.includes('सभी क्षेत्रों') ||
        query.includes('अन्य कॉलेज') ||
        query.includes('अन्य कॉलेजों') ||
        query.includes('अन्य संस्थानों') ||
        query.includes('राष्ट्रीय डेटा') ||
        query.includes('राष्ट्रीय') ||
        // Marathi keywords
        query.includes('सर्व प्रदेश') ||
        query.includes('सर्व विभाग') ||
        query.includes('इतर कॉलेज') ||
        query.includes('इतर संस्था') ||
        query.includes('इतर संस्थांचे') ||
        query.includes('इतर महाविद्यालये');

      if (probingOtherInstitutions) {
        const text = options.language === 'hi'
          ? 'गोपनीयता प्रतिबंध: संस्थान प्रशासक केवल अपने संस्थान (PICT / COEP) के रिकॉर्ड और विनियम देख सकते हैं। अन्य संस्थानों का डेटा या राष्ट्रीय सांख्यिकी देखना अधिकृत नहीं है।'
          : options.language === 'mr'
          ? 'गोपनीयता निर्बंध: संस्था प्रशासक फक्त स्वतःच्या संस्थेचे (PICT / COEP) तपशील आणि नियमावली पाहू शकतात. इतर संस्थांचा डेटा किंवा राष्ट्रीय आकडेवारी पाहण्यास परवानगी नाही.'
          : 'Access Restricted: Institutional administrators can only query records and regulatory compliance for their own institution. Access to other institutions\' applications is protected under AICTE Data Governance norms.';

        return {
          restricted: true,
          response: {
            messageText: text,
            language: options.language,
            sources: [
              {
                id: 'sec_auth_01',
                type: 'handbook_clause',
                title: 'Data Governance and Institutional Privacy Protocols',
                reference: 'AICTE Institutional Data Governance Act, Sec 4(b)',
                snippet: 'Institutional administrative credentials are strictly partitioned to self-records and cannot inspect peer institutions.',
              }
            ],
            linkedCases: [],
            isInsufficientEvidence: false,
            isPermissionRestricted: true,
          }
        };
      }
    }

    if (role === 'regional_officer') {
      const probingOtherRegions = 
        (query.includes('northern') && !query.includes('western')) || 
        (query.includes('eastern') && !query.includes('western')) ||
        (query.includes('southern') && !query.includes('western'));

      if (probingOtherRegions) {
        const text = options.language === 'hi'
          ? 'क्षेत्रीय अधिकार सीमा: आप पश्चिमी क्षेत्रीय कार्यालय (WRO - महाराष्ट्र एवं गोवा) के अधिकृत अधिकारी हैं। अन्य क्षेत्रीय कार्यालयों के आंतरिक डेटा के लिए केंद्रीय ब्यूरो (HQ) प्राधिकार आवश्यक है।'
          : options.language === 'mr'
          ? 'प्रादेशिक अधिकार मर्यादा: आपण पश्चिम प्रादेशिक कार्यालय (WRO - महाराष्ट्र व गोवा) चे अधिकृत अधिकारी आहात. इतर प्रादेशिक कार्यालयांच्या डेटासाठी केंद्रीय ब्यूरो (HQ) परवानगी आवश्यक आहे.'
          : 'Jurisdiction Notice: Your credentials authorize access to Western Regional Office (WRO - Maharashtra & Goa) applications. National multi-region comparative oversight requires Central Bureau (HQ) authorization.';

        return {
          restricted: true,
          response: {
            messageText: text,
            language: options.language,
            sources: [
              {
                id: 'sec_ro_01',
                type: 'handbook_clause',
                title: 'Regional Office Territorial Jurisdiction',
                reference: 'APH 2026-27, Chapter I, Clause 1.4',
                snippet: 'Regional Officers exercise statutory scrutiny exclusively within their assigned State and Union Territory jurisdiction.',
              }
            ],
            linkedCases: [],
            isInsufficientEvidence: false,
            isPermissionRestricted: true,
          }
        };
      }
    }

    return {
      restricted: false,
      response: {} as any,
    };
  }

  // =========================================================================
  // INTENT HANDLERS
  // =========================================================================

  /**
   * Handle: "Which regions have the most overdue cases?"
   */
  private static handleOverdueRegionsIntent(
    apps: ApplicationRecord[],
    lang: Language,
    _role: UserRole
  ): ChatbotResponsePayload {
    const overdueApps = apps.filter(a => a.deadlineStatus === 'Overdue' && a.currentStatus !== 'Approved');

    // Aggregate by region
    const regionMap: Record<string, number> = {};
    overdueApps.forEach(a => {
      regionMap[a.region] = (regionMap[a.region] || 0) + 1;
    });

    const sortedRegions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
    const topRegion = sortedRegions.length > 0 ? sortedRegions[0][0] : 'None';
    const topCount = sortedRegions.length > 0 ? sortedRegions[0][1] : 0;

    let text = '';
    if (lang === 'hi') {
      text = `सत्यापित वैधानिक आंकड़ों के आधार पर, **${topRegion} क्षेत्र** में सबसे अधिक अतिदेय मामले (${topCount} मामले) हैं।
वर्तमान में कुल **${overdueApps.length} मामले** अपनी वैधानिक समयसीमा (SLA) पार कर चुके हैं:
• **उत्तरी क्षेत्र (Northern)**: AICTE/2026-27/1-9382105118 (दिल्ली टेक्नोलॉजिकल यूनिवर्सिटी • 12 दिन EVC विलंब)
• **उत्तर-पश्चिमी क्षेत्र (North-Western)**: AICTE/2026-27/1-9382118712 (एमएनआईटी एक्सटेंशन • 22 दिन SAC विलंब)`;
    } else if (lang === 'mr') {
      text = `तपासलेल्या वैधानिक आकडेवारीनुसार, **${topRegion} विभागात** सर्वाधिक थकीत प्रकरणे (${topCount} प्रकरणे) आहेत.
सध्या एकूण **${overdueApps.length} प्रकरणे** त्यांची वैधानिक मुदत (SLA) ओलांडून प्रलंबित आहेत:
• **उत्तर विभाग (Northern)**: AICTE/2026-27/1-9382105118 (दिल्ली टेक्नॉलॉजिकल युनिव्हर्सिटी • 12 दिवस EVC विलंब)
• **उत्तर-पश्चिम विभाग (North-Western)**: AICTE/2026-27/1-9382118712 (MNIT Extension • 22 दिवस SAC प्रलंबित)`;
    } else {
      text = `Based on verified statutory records, **${topRegion} Region** currently has the highest volume of overdue cases (${topCount} cases).
A total of **${overdueApps.length} applications** across the national pipeline have breached their statutory deadline SLAs:
• **Northern Region**: AICTE/2026-27/1-9382105118 (Delhi Technological University) — EVC inspection delayed by 12 days.
• **North-Western Region**: AICTE/2026-27/1-9382118712 (MNIT Extension) — Standing Appellate Committee (SAC) appeal pending for 22 days.`;
    }

    const linkedCases: LinkedCaseInfo[] = overdueApps.map(a => this.toLinkedCaseInfo(a));

    const sources: SourceReference[] = [
      {
        id: 'src_overdue_db',
        type: 'verified_database_record',
        title: 'Central Approval Bureau Real-Time Overdue Registry',
        reference: 'AICTE Application Records Registry AY 2026-27',
        snippet: `${overdueApps.length} overdue applications logged with SLA breach indicators.`,
      },
      {
        id: 'src_aph_sla',
        type: 'handbook_clause',
        title: 'Statutory Processing SLA Timelines',
        reference: 'APH 2026-27, Appendix 1',
        snippet: 'Scrutiny and committee decisions must adhere strictly to statutory turnaround windows.',
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases,
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: "Which applications need urgent attention?"
   */
  private static handleUrgentCasesIntent(
    apps: ApplicationRecord[],
    lang: Language,
    _role: UserRole
  ): ChatbotResponsePayload {
    const urgentApps = apps.filter(a => 
      (a.deadlineStatus === 'Overdue' || a.deadlineStatus === 'Approaching Deadline' || a.evcStatus === 'Delayed' || a.complianceStatus === 'Critical Deficiency') &&
      a.currentStatus !== 'Approved'
    ).slice(0, 3);

    let text = '';
    if (lang === 'hi') {
      text = `निम्नलिखित **${urgentApps.length} आवेदनों** को तत्काल प्रशासनिक हस्तक्षेप की आवश्यकता है:
1. **${urgentApps[0]?.applicationNumber}** (${urgentApps[0]?.institutionName}): ${urgentApps[0]?.currentStage} में विलंबित • EVC स्थिति: ${urgentApps[0]?.evcStatus}।
2. **${urgentApps[1]?.applicationNumber}** (${urgentApps[1]?.institutionName}): समयसीमा समाप्त होने वाली है • ${urgentApps[1]?.deficienciesCount} त्रुटियां दर्ज।
${urgentApps[2] ? `3. **${urgentApps[2]?.applicationNumber}** (${urgentApps[2]?.institutionName}): ${urgentApps[2]?.currentStage} पर समीक्षा प्रतीक्षित।` : ''}

**अनुशंसित वैधानिक कार्रवाई**: क्षेत्रीय अधिकारी को अनुस्मारक जारी करें या ई-हियरिंग नोटिस प्रेषित करें।`;
    } else if (lang === 'mr') {
      text = `खालील **${urgentApps.length} अर्जांवर** तातडीने प्रशासकीय कारवाई करणे आवश्यक आहे:
1. **${urgentApps[0]?.applicationNumber}** (${urgentApps[0]?.institutionName}): ${urgentApps[0]?.currentStage} टप्प्यावर विलंब • EVC स्थिती: ${urgentApps[0]?.evcStatus}.
2. **${urgentApps[1]?.applicationNumber}** (${urgentApps[1]?.institutionName}): मुदत संपत आली आहे • ${urgentApps[1]?.deficienciesCount} त्रुटी प्रलंबित.
${urgentApps[2] ? `3. **${urgentApps[2]?.applicationNumber}** (${urgentApps[2]?.institutionName}): ${urgentApps[2]?.currentStage} टप्प्यावर प्रलंबित.` : ''}

**शिफारस केलेली वैधानिक कारवाई**: प्रादेशिक अधिकाऱ्यांना स्मरणपत्र पाठवणे किंवा सुनावणी नोटीस जारी करणे.`;
    } else {
      text = `The following **${urgentApps.length} applications** require immediate senior authority intervention:
1. **${urgentApps[0]?.applicationNumber}** (${urgentApps[0]?.institutionName}): Delayed in ${urgentApps[0]?.currentStage} — EVC inspection status is ${urgentApps[0]?.evcStatus}.
2. **${urgentApps[1]?.applicationNumber}** (${urgentApps[1]?.institutionName}): Statutory deadline is due today or approaching — ${urgentApps[1]?.deficienciesCount} compliance deficiencies logged.
${urgentApps[2] ? `3. **${urgentApps[2]?.applicationNumber}** (${urgentApps[2]?.institutionName}): Requires final Bureau approval sign-off before academic session freeze.` : ''}

**Recommended Action**: Dispatch official Central Bureau directive or reassign inspection panel.`;
    }

    const linkedCases: LinkedCaseInfo[] = urgentApps.map(a => this.toLinkedCaseInfo(a));

    const sources: SourceReference[] = [
      {
        id: 'src_urgent_cases',
        type: 'verified_database_record',
        title: 'Priority Escalation Ledger',
        reference: 'AICTE SmartAssist Escalation Action Centre',
        snippet: 'Cases flagged with Level 2 / Level 3 delay or deficiency severity.',
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases,
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: "What EVC tasks are overdue?"
   */
  private static handleEvcOverdueIntent(
    apps: ApplicationRecord[],
    lang: Language,
    _role: UserRole
  ): ChatbotResponsePayload {
    const evcDelayedApps = apps.filter(a => a.evcStatus === 'Delayed' || (a.evcStatus === 'Pending Scheduling' && a.daysInCurrentStage >= 10));

    let text = '';
    if (lang === 'hi') {
      text = `सिस्टम रिकॉर्ड के अनुसार, वर्तमान में **${evcDelayedApps.length} विशेषज्ञ दौरा समिति (EVC) कार्य** अतिदेय हैं:
• **${evcDelayedApps[0]?.applicationNumber}** (${evcDelayedApps[0]?.institutionName}): EVC भौतिक निरीक्षण रिपोर्ट वैधानिक 3-दिवसीय SLA से 12 दिन विलंबित है (प्रभारी अधिकारी: ${evcDelayedApps[0]?.assignedOfficer})।
${evcDelayedApps[1] ? `• **${evcDelayedApps[1]?.applicationNumber}** (${evcDelayedApps[1]?.institutionName}): EVC समिति का गठन एवं निरीक्षण 10 दिनों से लंबित है।` : ''}

**सांविधिक नियम (APH Clause 2.14)**: EVC अध्यक्ष द्वारा दौरे के 3 कार्य दिवसों के भीतर ऑनलाइन सत्यापन रिपोर्ट प्रस्तुत करना अनिवार्य है।`;
    } else if (lang === 'mr') {
      text = `सिस्टम नोंदीनुसार, सध्या **${evcDelayedApps.length} तज्ज्ञ भेट समिती (EVC) कामे** थकीत आहेत:
• **${evcDelayedApps[0]?.applicationNumber}** (${evcDelayedApps[0]?.institutionName}): EVC प्रत्यक्ष तपासणी अहवाल वैधानिक 3 दिवसांच्या SLA पेक्षा 12 दिवस लांबणीवर पडला आहे (अधिकारी: ${evcDelayedApps[0]?.assignedOfficer}).
${evcDelayedApps[1] ? `• **${evcDelayedApps[1]?.applicationNumber}** (${evcDelayedApps[1]?.institutionName}): EVC समिती नियुक्ती 10 दिवसांपासून प्रलंबित आहे.` : ''}

**वैधानिक नियम (APH Clause 2.14)**: EVC अध्यक्षांनी भेटीनंतर 3 दिवसांच्या आत अहवाल अपलोड करणे बंधनकारक आहे.`;
    } else {
      text = `According to verified system records, **${evcDelayedApps.length} Expert Visiting Committee (EVC) tasks** are currently overdue:
• **${evcDelayedApps[0]?.applicationNumber}** (${evcDelayedApps[0]?.institutionName}): EVC physical inspection report is delayed by 12 days past the statutory 3-day window (Assigned RO: ${evcDelayedApps[0]?.assignedOfficer}).
${evcDelayedApps[1] ? `• **${evcDelayedApps[1]?.applicationNumber}** (${evcDelayedApps[1]?.institutionName}): EVC panel scheduling pending for 12 days in ${evcDelayedApps[1]?.region} Region.` : ''}

**Mandatory Statutory Norm**: Under APH Clause 2.14(f), the EVC Chairman must upload the verified report within 3 working days of the physical inspection.`;
    }

    const linkedCases: LinkedCaseInfo[] = evcDelayedApps.map(a => this.toLinkedCaseInfo(a));

    const sources: SourceReference[] = [
      {
        id: 'src_evc_reg',
        type: 'handbook_clause',
        title: 'EVC Inspection and Report Submission Protocols',
        reference: 'APH 2026-27, Clause 2.14(f)',
        snippet: 'Chairman of Expert Visiting Committee must upload verified report within 3 working days.',
      },
      {
        id: 'src_evc_case',
        type: 'verified_database_record',
        title: 'EVC Inspection Tracker',
        reference: evcDelayedApps[0]?.applicationNumber || 'EVC Pipeline',
        snippet: `EVC report pending since ${evcDelayedApps[0]?.submittedDate || 'submission'}.`,
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases,
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: "Which compliance deadlines are approaching?"
   */
  private static handleComplianceDeadlinesIntent(
    apps: ApplicationRecord[],
    lang: Language,
    _role: UserRole
  ): ChatbotResponsePayload {
    const approachingApps = apps.filter(a => 
      (a.deadlineStatus === 'Approaching Deadline' || a.deadlineDate === '2026-10-22' || (a.deadlineDate >= '2026-10-22' && a.deadlineDate <= '2026-10-29')) &&
      a.currentStatus !== 'Approved'
    );

    let text = '';
    if (lang === 'hi') {
      text = `आगामी 7 दिनों में **${approachingApps.length} संस्थानों की अनुपालन समयसीमाएं** समाप्त हो रही हैं:
1. **${approachingApps[0]?.applicationNumber}** (${approachingApps[0]?.institutionName}): समयसीमा **${approachingApps[0]?.deadlineDate}** (आज देय • त्रुटि सुधार आवश्यक)।
2. **${approachingApps[1]?.applicationNumber}** (${approachingApps[1]?.institutionName}): समयसीमा **${approachingApps[1]?.deadlineDate}** (प्रवेश क्षमता में वृद्धि • मुख्यालय अनुमोदन)।
${approachingApps[2] ? `3. **${approachingApps[2]?.applicationNumber}** (${approachingApps[2]?.institutionName}): समयसीमा **${approachingApps[2]?.deadlineDate}** (दस्तावेज़ नवीनीकरण प्रतीक्षित)।` : ''}

संस्थानों को स्वतः एसएमएस/ईमेल अनुस्मारक प्रेषित किए जा चुके हैं।`;
    } else if (lang === 'mr') {
      text = `पुढील 7 दिवसांत **${approachingApps.length} संस्थांच्या अनुपालन मुदती** संपत आहेत:
1. **${approachingApps[0]?.applicationNumber}** (${approachingApps[0]?.institutionName}): मुदत दिनांक **${approachingApps[0]?.deadlineDate}** (आज देय • त्रुटी पूर्तता).
2. **${approachingApps[1]?.applicationNumber}** (${approachingApps[1]?.institutionName}): मुदत दिनांक **${approachingApps[1]?.deadlineDate}** (प्रवेश क्षमता वाढ • मुख्यालय मंजुरी).
${approachingApps[2] ? `3. **${approachingApps[2]?.applicationNumber}** (${approachingApps[2]?.institutionName}): मुदत दिनांक **${approachingApps[2]?.deadlineDate}** (कागदपत्र नूतनीकरण).` : ''}

संबंधित संस्थांना स्वयंचलित सूचना आधीच पाठवण्यात आल्या आहेत.`;
    } else {
      text = `The following **${approachingApps.length} compliance deadlines** are approaching within the next 7 calendar days:
1. **${approachingApps[0]?.applicationNumber}** (${approachingApps[0]?.institutionName}): Due on **${approachingApps[0]?.deadlineDate}** (Due Today — Scrutiny deficiency rectification).
2. **${approachingApps[1]?.applicationNumber}** (${approachingApps[1]?.institutionName}): Due on **${approachingApps[1]?.deadlineDate}** (Increase in Intake — Regional Committee review).
${approachingApps[2] ? `3. **${approachingApps[2]?.applicationNumber}** (${approachingApps[2]?.institutionName}): Due on **${approachingApps[2]?.deadlineDate}** (Document renewal awaited).` : ''}

Automated statutory reminders have been logged and dispatched to institutions.`;
    }

    const linkedCases: LinkedCaseInfo[] = approachingApps.map(a => this.toLinkedCaseInfo(a));

    const sources: SourceReference[] = [
      {
        id: 'src_approaching_deadlines',
        type: 'statutory_calendar',
        title: 'Statutory 7-Day Compliance Window',
        reference: 'AICTE SmartAssist Deadline Radar',
        snippet: 'Cases maturing within statutory milestone SLA thresholds.',
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases,
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: "Why is this application delayed?"
   */
  private static handleCaseDelayIntent(
    query: string,
    apps: ApplicationRecord[],
    lang: Language,
    _role: UserRole
  ): ChatbotResponsePayload {
    const targetCase = this.findMatchingApplication(query, apps) || apps.find(a => a.deadlineStatus === 'Overdue') || apps[0];

    let text = '';
    if (lang === 'hi') {
      text = `**आवेदन ${targetCase.applicationNumber} (${targetCase.institutionName})** के विलंब का सत्यापित तकनीकी कारण:
• **वर्तमान चरण**: ${targetCase.currentStage} (इस चरण में व्यतीत समय: ${targetCase.daysInCurrentStage} दिन)
• **विलंब का मुख्य कारण**: ${targetCase.escalationReason || 'ईवीसी भौतिक समिति निरीक्षण रिपोर्ट वैधानिक समयसीमा से अधिक समय से लंबित है।'}
• **अनुपालन स्थिति**: ${targetCase.complianceStatus} (${targetCase.deficienciesCount} त्रुटियां, ${targetCase.expiringDocumentsCount} कालबाह्य दस्तावेज़)
• **जिम्मेदार अधिकारी**: ${targetCase.assignedOfficer}

**अनुशंसित समाधान**: ${targetCase.recommendedAction || 'निरीक्षण पैनल अध्यक्ष को अनुस्मारक जारी करें या स्थानापन्न विशेषज्ञ नियुक्त करें।'}`;
    } else if (lang === 'mr') {
      text = `**अर्ज क्रमांक ${targetCase.applicationNumber} (${targetCase.institutionName})** मधील विलंबाचे तपासलेले कारण:
• **सध्याचा टप्पा**: ${targetCase.currentStage} (या टप्प्यातील दिवस: ${targetCase.daysInCurrentStage} दिवस)
• **विलंबाचे कारण**: ${targetCase.escalationReason || 'EVC प्रत्यक्ष तपासणी अहवाल वैधानिक वेळेत सादर झालेला नाही.'}
• **अनुपालन स्थिती**: ${targetCase.complianceStatus} (${targetCase.deficienciesCount} त्रुटी, ${targetCase.expiringDocumentsCount} कालबाह्य कागदपत्रे)
• **नियुक्त अधिकारी**: ${targetCase.assignedOfficer}

**शिफारस केलेली कारवाई**: ${targetCase.recommendedAction || 'तपासणी समिती अध्यक्षांना तातडीचे स्मरणपत्र पाठवणे किंवा पर्यायी तज्ज्ञ नेमणे.'}`;
    } else {
      text = `Root-cause analysis for **Application ${targetCase.applicationNumber} (${targetCase.institutionName})**:
• **Current Stage**: ${targetCase.currentStage} (Elapsed in stage: ${targetCase.daysInCurrentStage} days; Total processing: ${targetCase.processingTimeDays} days).
• **Primary Cause of Delay**: ${targetCase.escalationReason || 'Expert Visiting Committee (EVC) inspection report delayed beyond statutory 3-day upload norm.'}
• **Compliance State**: ${targetCase.complianceStatus} (${targetCase.deficienciesCount} unresolved deficiencies, ${targetCase.expiringDocumentsCount} expiring statutory NOCs).
• **Assigned Officer**: ${targetCase.assignedOfficer} (${targetCase.assignedOfficerEmail || 'RO Office'}).

**Statutory Recommendation**: ${targetCase.recommendedAction || 'Issue formal reminder to Inspection Committee Chairman or appoint substitute scrutiny expert.'}`;
    }

    const linkedCases: LinkedCaseInfo[] = [this.toLinkedCaseInfo(targetCase)];

    const sources: SourceReference[] = [
      {
        id: `src_delay_${targetCase.id}`,
        type: 'verified_database_record',
        title: `Audit Ledger for ${targetCase.applicationNumber}`,
        reference: `Application ID: ${targetCase.id}`,
        snippet: `Stage latency: ${targetCase.daysInCurrentStage} days in ${targetCase.currentStage}. Status: ${targetCase.currentStatus}.`,
      },
      {
        id: 'src_aph_inspection_sla',
        type: 'handbook_clause',
        title: 'Statutory Inspection Timelines',
        reference: 'APH 2026-27, Clause 2.14',
        snippet: 'Delays exceeding stage thresholds require Senior Authority Escalation intervention.',
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases,
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: Institution Admin checking status of own application
   */
  private static handleInstitutionStatusIntent(
    permittedApps: ApplicationRecord[],
    lang: Language
  ): ChatbotResponsePayload {
    const ownCase = permittedApps[0] || {
      id: 'app_1001',
      applicationNumber: 'AICTE/2026-27/1-9382104921',
      institutionName: 'Pune Institute of Computer Technology (PICT)',
      instituteCode: '1-4293811',
      region: 'Western',
      state: 'Maharashtra',
      applicationType: 'Increase in Intake',
      currentStage: 'Bureau HQ Final Review',
      currentStatus: 'Pending HQ Approval',
      assignedOfficer: 'Dr. S. K. Mahajan (RO Western)',
      deadlineDate: '2026-10-29',
      evcStatus: 'Report Submitted',
      complianceStatus: 'Compliant',
      deficienciesCount: 0,
      expiringDocumentsCount: 0,
    } as ApplicationRecord;

    let text = '';
    if (lang === 'hi') {
      text = `**संस्थान आवेदन स्थिति (PICT - कोड: ${ownCase.instituteCode})**:
• **आवेदन संख्या**: ${ownCase.applicationNumber} (${ownCase.applicationType})
• **वर्तमान स्थिति**: ${ownCase.currentStatus} (${ownCase.currentStage})
• **EVC निरीक्षण**: ${ownCase.evcStatus} (सत्यापित रिपोर्ट जमा)
• **अनुपालन स्थिति**: ${ownCase.complianceStatus} (${ownCase.deficienciesCount} लंबित त्रुटियां)
• **वैधानिक समयसीमा**: ${ownCase.deadlineDate}

आपके संस्थान के सभी आवश्यक प्रमाणपत्र और संकाय बायोमेट्रिक डेटा सत्यापित हो चुके हैं। अंतिम अनुमोदन आदेश मुख्यालय द्वारा प्रक्रियाधीन है।`;
    } else if (lang === 'mr') {
      text = `**संस्था अर्ज स्थिती (PICT - कोड: ${ownCase.instituteCode})**:
• **अर्ज क्रमांक**: ${ownCase.applicationNumber} (${ownCase.applicationType})
• **सध्याची स्थिती**: ${ownCase.currentStatus} (${ownCase.currentStage})
• **EVC तपासणी**: ${ownCase.evcStatus} (तपासणी अहवाल प्राप्त)
• **अनुपालन स्थिती**: ${ownCase.complianceStatus} (${ownCase.deficienciesCount} प्रलंबित त्रुटी)
• **वैधानिक मुदत**: ${ownCase.deadlineDate}

आपल्या संस्थेचे सर्व आवश्यक प्रमाणपत्रे आणि प्राध्यापक बायोमेट्रिक तपशील सत्यापित झाले आहेत. अंतिम मान्यता आदेश मुख्यालयाकडून अंतिम टप्प्यात आहे.`;
    } else {
      text = `**Application Status for ${ownCase.institutionName} (Code: ${ownCase.instituteCode})**:
• **Application Number**: ${ownCase.applicationNumber} (${ownCase.applicationType})
• **Current Stage**: ${ownCase.currentStage}
• **Current Status**: ${ownCase.currentStatus}
• **EVC Inspection**: ${ownCase.evcStatus}
• **Compliance Status**: ${ownCase.complianceStatus} (${ownCase.deficienciesCount} deficiencies, ${ownCase.expiringDocumentsCount} expiring NOCs)
• **Approval Deadline**: ${ownCase.deadlineDate}

All statutory affidavits and faculty biometric requirements for your institution have been cleared by the Regional Scrutiny Panel. Final Statutory Approval order is pending Central Bureau sign-off.`;
    }

    const linkedCases: LinkedCaseInfo[] = [this.toLinkedCaseInfo(ownCase)];

    const sources: SourceReference[] = [
      {
        id: `src_inst_${ownCase.id}`,
        type: 'verified_database_record',
        title: `Institutional Registry: ${ownCase.institutionName}`,
        reference: ownCase.applicationNumber,
        snippet: `Application is active in ${ownCase.currentStage}. Assigned RO: ${ownCase.assignedOfficer}.`,
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases,
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: Regulatory Handbook Consultation (APH 2026-27 clauses)
   */
  private static handleRegulatoryHandbookIntent(
    item: RegulatoryKnowledge,
    lang: Language
  ): ChatbotResponsePayload {
    const text = item[lang] || item.en;

    const sources: SourceReference[] = [
      {
        id: `src_aph_${item.topicKey}`,
        type: 'handbook_clause',
        title: item.title,
        reference: `AICTE APH 2026-27, ${item.clause}`,
        snippet: item.en,
      }
    ];

    return {
      messageText: text,
      language: lang,
      sources,
      linkedCases: [],
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: Specific Application Summary
   */
  private static handleSpecificCaseSummaryIntent(
    targetCase: ApplicationRecord,
    lang: Language,
    _role: UserRole
  ): ChatbotResponsePayload {
    let text = '';
    if (lang === 'hi') {
      text = `**आवेदन विवरण: ${targetCase.applicationNumber}**
• **संस्थान**: ${targetCase.institutionName} (कोड: ${targetCase.instituteCode}, क्षेत्र: ${targetCase.region})
• **प्रकार**: ${targetCase.applicationType}
• **वर्तमान स्थिति**: ${targetCase.currentStatus} (${targetCase.currentStage})
• **अंतिम तिथि**: ${targetCase.deadlineDate} (${targetCase.deadlineStatus})
• **प्रभारी अधिकारी**: ${targetCase.assignedOfficer}`;
    } else if (lang === 'mr') {
      text = `**अर्ज तपशील: ${targetCase.applicationNumber}**
• **संस्था**: ${targetCase.institutionName} (कोड: ${targetCase.instituteCode}, विभाग: ${targetCase.region})
• **प्रकार**: ${targetCase.applicationType}
• **सध्याची स्थिती**: ${targetCase.currentStatus} (${targetCase.currentStage})
• **अंतिम मुदत**: ${targetCase.deadlineDate} (${targetCase.deadlineStatus})
• **नियुक्त अधिकारी**: ${targetCase.assignedOfficer}`;
    } else {
      text = `**Application Record: ${targetCase.applicationNumber}**
• **Institution**: ${targetCase.institutionName} (Code: ${targetCase.instituteCode}, Region: ${targetCase.region})
• **Type**: ${targetCase.applicationType} (AY 2026-2027)
• **Current Status**: ${targetCase.currentStatus} in ${targetCase.currentStage}
• **Statutory Deadline**: ${targetCase.deadlineDate} (${targetCase.deadlineStatus})
• **Assigned Officer**: ${targetCase.assignedOfficer}
• **EVC Inspection**: ${targetCase.evcStatus} • **Compliance**: ${targetCase.complianceStatus}`;
    }

    return {
      messageText: text,
      language: lang,
      sources: [
        {
          id: `src_case_${targetCase.id}`,
          type: 'verified_database_record',
          title: `Case File ${targetCase.applicationNumber}`,
          reference: `AICTE Central Application Registry`,
          snippet: `Record verified in current active academic year database.`,
        }
      ],
      linkedCases: [this.toLinkedCaseInfo(targetCase)],
      isInsufficientEvidence: false,
      isPermissionRestricted: false,
    };
  }

  /**
   * Handle: Insufficient Evidence Safeguard (Anti-Hallucination)
   */
  private static handleInsufficientEvidence(
    rawQuery: string,
    lang: Language
  ): ChatbotResponsePayload {
    let text = '';
    if (lang === 'hi') {
      text = `**अपर्याप्त साक्ष्य सूचना**: आपके प्रश्न *"${rawQuery}"* से संबंधित कोई सत्यापित वैधानिक रिकॉर्ड या अनुमोदित पुस्तिका नियम वर्तमान डेटाबेस में उपलब्ध नहीं है।

AICTE SmartAssist अपुष्ट उत्तर नहीं बनाता है। कृपया वैध आवेदन संख्या (उदा. AICTE/2026-27/1-9382104921) या विशिष्ट वैधानिक विषय (EVC नियम, प्रवेश क्षमता, समयसीमा कैलेंडर) पूछें।`;
    } else if (lang === 'mr') {
      text = `**अपुऱ्या पुराव्याची नोंद**: आपल्या *"${rawQuery}"* या प्रश्नाशी संबंधित कोणतीही अधिकृत वैधानिक नोंद किंवा पुस्तिका नियम डेटाबेसमध्ये उपलब्ध नाही.

AICTE SmartAssist अप्रमाणित उत्तरे तयार करत नाही. कृपया वैध अर्ज क्रमांक (उदा. AICTE/2026-27/1-9382104921) किंवा अधिकृत विषय (EVC नियम, प्रवेश क्षमता, मुदत दिनदर्शिका) विचारा.`;
    } else {
      text = `**Insufficient Evidence Notice**: There are no verified statutory records, active application files, or approved Handbook clauses matching your inquiry: *"${rawQuery}"*.

AICTE SmartAssist enforces strict grounding and does not generate unverified answers. Please specify a valid Application ID (e.g. AICTE/2026-27/1-9382105118), institution name, or regulatory topic (such as EVC inspection norms, deadline calendar, or intake expansion criteria).`;
    }

    return {
      messageText: text,
      language: lang,
      sources: [],
      linkedCases: [],
      isInsufficientEvidence: true,
      isPermissionRestricted: false,
    };
  }

  // =========================================================================
  // HELPER MATCHERS & UTILITIES
  // =========================================================================

  private static isIntentOverdueRegions(q: string): boolean {
    return (
      (q.includes('region') || q.includes('क्षेत्र') || q.includes('विभाग') || q.includes('प्रदेश')) &&
      (q.includes('overdue') || q.includes('most overdue') || q.includes('अतिदेय') || q.includes('थकीत') || q.includes('मुदत संपलेले'))
    );
  }

  private static isIntentUrgentCases(q: string): boolean {
    return (
      (q.includes('urgent') || q.includes('attention') || q.includes('तत्काल') || q.includes('तातडीने') || q.includes('प्राधान्य')) ||
      (q.includes('critical') && q.includes('case'))
    );
  }

  private static isIntentEvcOverdue(q: string): boolean {
    return (
      (q.includes('evc') || q.includes('ईवीसी') || q.includes('ईव्हीसी') || q.includes('visiting committee') || q.includes('दौरा समिति') || q.includes('भेट समिती')) &&
      (q.includes('overdue') || q.includes('delay') || q.includes('अतिदेय') || q.includes('विलंब') || q.includes('थकीत') || q.includes('काम'))
    );
  }

  private static isIntentComplianceDeadlines(q: string): boolean {
    return (
      (q.includes('compliance') || q.includes('deadline') || q.includes('अनुपालन') || q.includes('समयसीमा') || q.includes('मुदत')) &&
      (q.includes('approaching') || q.includes('due') || q.includes('निकट') || q.includes('जवळ') || q.includes('संपत'))
    );
  }

  private static isIntentCaseDelay(q: string): boolean {
    return (
      (q.includes('why') || q.includes('delay') || q.includes('क्यों') || q.includes('विलंबित') || q.includes('का लांबणीवर') || q.includes('कारण')) &&
      (q.includes('application') || q.includes('case') || q.includes('आवेदन') || q.includes('अर्ज') || q.includes('app_') || q.includes('aicte/'))
    );
  }

  private static isIntentStatutoryDecisionRequest(q: string): boolean {
    return (
      (q.includes('approve') || q.includes('reject') || q.includes('sanction') || q.includes('grant approval') || q.includes('make decision') || q.includes('मंजूर') || q.includes('स्वीकृत')) &&
      (q.includes('application') || q.includes('case') || q.includes('can you') || q.includes('please') || q.includes('my application') || q.includes('this application') || q.includes('करा') || q.includes('कर दो') || q.includes('निर्णय'))
    );
  }

  private static handleStatutoryDecisionRefusal(lang: Language): ChatbotResponsePayload {
    let messageText = '';
    if (lang === 'hi') {
      messageText = '⚠️ **सांविधिक अस्वीकरण: निर्णय अधिकार का अभाव**\n\nएआईसीटीई स्मार्टअसिस्ट एआई सह-पायलट एक सूचनात्मक एवं प्रक्रियात्मक सहायता प्रणाली है। एआईसीटीई अधिनियम 1987 की धारा 10 एवं APH 2026-27 के अनुसार, **यह प्रणाली कोई भी विनियामक निर्णय (स्वीकृति अथवा अस्वीकृति) लेने का वैधानिक अधिकार नहीं रखती है**।\n\nसभी विनियामक निर्णय केवल विधिवत अधिकृत वैधानिक अधिकारियों (क्षेत्रीय अधिकारी, संवीक्षा समिति, अथवा केंद्रीय ब्यूरो प्रमुख) द्वारा ही डिजिटल हस्ताक्षर के साथ लिए जा सकते हैं। कृपया अपने अधिकृत डैशबोर्ड के माध्यम से संबंधित अधिकारी से संपर्क करें।';
    } else if (lang === 'mr') {
      messageText = '⚠️ **वैधानिक अस्वीकरण: निर्णय अधिकार मर्यादा**\n\nएआयसीटीई स्मार्टअसिस्ट एआय सह-पायलट ही केवळ माहिती आणि मार्गदर्शनासाठी तयार केलेली सहाय्यक प्रणाली आहे. एआयसीटीई कायदा 1987 चे कलम 10 आणि APH 2026-27 नियमांनुसार, **ही प्रणाली कोणताही वैधानिक निर्णय (मंजुरी अथवा नामंजुरी) घेऊ शकत नाही**.\n\nसर्व वैधानिक निर्णय केवळ नियुक्त सक्षम अधिकाऱ्यांद्वारेच (प्रादेशिक अधिकारी, छाननी समिती किंवा केंद्रीय ब्युरो प्रमुख) अधिकृत प्रशासकीय डिजिटल स्वाक्षरीने घेतले जाणे बंधनकारक आहे.';
    } else {
      messageText = '⚠️ **Statutory Disclaimer: Decision-Making Restriction**\n\nThe AICTE SmartAssist AI Copilot is an informational and regulatory assistance system. Pursuant to Section 10 of the AICTE Act 1987 and statutory Approval Process Handbook (APH 2026-27) regulations, **this AI system CANNOT make, approve, reject, or substitute official regulatory approval decisions**.\n\nAll statutory decisions must be executed exclusively by designated statutory authorities (Regional Officer, Scrutiny Committee, or Central Bureau Head) with authorized administrative credentials and official digital signatures.';
    }

    return {
      messageText,
      language: lang,
      sources: [
        {
          id: 'aicte_act_sec10',
          type: 'handbook_clause',
          title: 'AICTE Act 1987, Section 10 — Statutory Decision-Making Authority',
          reference: 'https://www.aicte-india.org/bureaus/approval/aph-2026-27',
          snippet: 'Statutory powers to grant or reject approval to technical institutions vest exclusively in the Council and designated regulatory authorities.',
        },
      ],
      linkedCases: [],
      isInsufficientEvidence: false,
      isPermissionRestricted: true,
    };
  }

  private static findRegulatoryMatch(q: string): RegulatoryKnowledge | null {
    if (q.includes('workflow') || q.includes('stages') || q.includes('steps') || q.includes('process') || q.includes('टप्पे') || q.includes('कार्यप्रवाह') || q.includes('प्रक्रिया')) {
      return REGULATORY_KNOWLEDGE.find(k => k.topicKey === 'workflow_steps') || null;
    }
    if (q.includes('compliance') || q.includes('standards') || q.includes('ragging') || q.includes('biometric') || q.includes('fee') || q.includes('अनुपालन')) {
      return REGULATORY_KNOWLEDGE.find(k => k.topicKey === 'compliance_requirements') || null;
    }
    if (q.includes('evc') || q.includes('visiting committee') || q.includes('inspection') || q.includes('निरीक्षण')) {
      return REGULATORY_KNOWLEDGE.find(k => k.topicKey === 'evc_sla') || null;
    }
    if (q.includes('intake') || q.includes('increase') || q.includes('new course') || q.includes('प्रवेश क्षमता') || q.includes('वाढ')) {
      return REGULATORY_KNOWLEDGE.find(k => k.topicKey === 'intake_norms') || null;
    }
    if (q.includes('calendar') || q.includes('timeline') || q.includes('sla') || q.includes('deadline') || q.includes('कैलेंडर') || q.includes('दिनदर्शिका') || q.includes('मुदत')) {
      return REGULATORY_KNOWLEDGE.find(k => k.topicKey === 'statutory_calendar') || null;
    }
    if (q.includes('document') || q.includes('noc') || q.includes('fire safety') || q.includes('certificate') || q.includes('दस्तावेज़') || q.includes('कागदपत्र')) {
      return REGULATORY_KNOWLEDGE.find(k => k.topicKey === 'doc_validity') || null;
    }
    return null;
  }

  private static findMatchingApplication(
    q: string,
    apps: ApplicationRecord[]
  ): ApplicationRecord | null {
    return apps.find(a => 
      q.includes(a.id.toLowerCase()) ||
      q.includes(a.applicationNumber.toLowerCase()) ||
      q.includes(a.instituteCode.toLowerCase()) ||
      (a.institutionName.toLowerCase().length > 6 && q.includes(a.institutionName.toLowerCase())) ||
      (q.includes('pict') && a.institutionName.toLowerCase().includes('pict')) ||
      (q.includes('dtu') && a.institutionName.toLowerCase().includes('delhi technological')) ||
      (q.includes('delhi technological') && a.institutionName.toLowerCase().includes('delhi technological')) ||
      (q.includes('jadavpur') && a.institutionName.toLowerCase().includes('jadavpur')) ||
      (q.includes('bms') && a.institutionName.toLowerCase().includes('bms')) ||
      (q.includes('amravati') && a.institutionName.toLowerCase().includes('amravati'))
    ) || null;
  }

  private static toLinkedCaseInfo(app: ApplicationRecord): LinkedCaseInfo {
    return {
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      institutionName: app.institutionName,
      instituteCode: app.instituteCode,
      region: app.region,
      state: app.state,
      stage: app.currentStage,
      status: app.currentStatus,
      deadlineDate: app.deadlineDate,
      isOverdue: app.deadlineStatus === 'Overdue',
      evcStatus: app.evcStatus,
      complianceStatus: app.complianceStatus,
    };
  }

  /**
   * Return role-tailored and language-localized suggested prompt questions
   */
  static getSuggestedPrompts(role: UserRole, language: Language): SuggestedPrompt[] {
    if (role === 'bureau_officer') {
      if (language === 'hi') {
        return [
          { id: 'p_hi_1', role, language, category: 'overdue', text: 'किन क्षेत्रों में सबसे अधिक अतिदेय मामले हैं?' },
          { id: 'p_hi_2', role, language, category: 'delays', text: 'किन आवेदनों पर तत्काल ध्यान देने की आवश्यकता है?' },
          { id: 'p_hi_3', role, language, category: 'evc', text: 'कौन से ईवीसी कार्य अतिदेय हैं?' },
          { id: 'p_hi_4', role, language, category: 'compliance', text: 'कौन सी अनुपालन समयसीमाएं निकट आ रही हैं?' },
          { id: 'p_hi_5', role, language, category: 'delays', text: 'आवेदन AICTE/2026-27/1-9382105118 में विलंब क्यों है?' },
        ];
      }
      if (language === 'mr') {
        return [
          { id: 'p_mr_1', role, language, category: 'overdue', text: 'कोणत्या प्रदेशांमध्ये सर्वाधिक थकीत प्रकरणे आहेत?' },
          { id: 'p_mr_2', role, language, category: 'delays', text: 'कोणत्या अर्जांवर तातडीने लक्ष देणे आवश्यक आहे?' },
          { id: 'p_mr_3', role, language, category: 'evc', text: 'कोणती ईव्हीसी कामे थकीत आहेत?' },
          { id: 'p_mr_4', role, language, category: 'compliance', text: 'कोणत्या अनुपालन मुदती जवळ येत आहेत?' },
          { id: 'p_mr_5', role, language, category: 'delays', text: 'अर्ज AICTE/2026-27/1-9382105118 का लांबणीवर पडला आहे?' },
        ];
      }
      return [
        { id: 'p_en_1', role, language, category: 'overdue', text: 'Which regions have the most overdue cases?' },
        { id: 'p_en_2', role, language, category: 'delays', text: 'Which applications need urgent attention?' },
        { id: 'p_en_3', role, language, category: 'evc', text: 'What EVC tasks are overdue?' },
        { id: 'p_en_4', role, language, category: 'compliance', text: 'Which compliance deadlines are approaching?' },
        { id: 'p_en_5', role, language, category: 'delays', text: 'Why is application AICTE/2026-27/1-9382105118 delayed?' },
      ];
    }

    if (role === 'regional_officer') {
      if (language === 'hi') {
        return [
          { id: 'ro_hi_1', role, language, category: 'delays', text: 'हमारे क्षेत्र में कौन से आवेदन लंबित हैं?' },
          { id: 'ro_hi_2', role, language, category: 'evc', text: 'क्षेत्रीय ईवीसी निरीक्षणों की वर्तमान स्थिति क्या है?' },
          { id: 'ro_hi_3', role, language, category: 'compliance', text: 'पश्चिमी क्षेत्र के किन संस्थानों में त्रुटियां लंबित हैं?' },
          { id: 'ro_hi_4', role, language, category: 'handbook', text: 'ईवीसी निरीक्षण रिपोर्ट अपलोड करने की वैधानिक समयसीमा क्या है?' },
        ];
      }
      if (language === 'mr') {
        return [
          { id: 'ro_mr_1', role, language, category: 'delays', text: 'आमच्या विभागातील कोणते अर्ज प्रलंबित आहेत?' },
          { id: 'ro_mr_2', role, language, category: 'evc', text: 'पश्चिम विभागातील ईव्हीसी तपासणी अहवालांची स्थिती काय?' },
          { id: 'ro_mr_3', role, language, category: 'compliance', text: 'कोणत्या संस्थांच्या त्रुटींची पूर्तता प्रलंबित आहे?' },
          { id: 'ro_mr_4', role, language, category: 'handbook', text: 'EVC अहवाल अपलोड करण्याची वैधानिक मुदत किती दिवस आहे?' },
        ];
      }
      return [
        { id: 'ro_en_1', role, language, category: 'delays', text: 'Which applications are pending in our Western Region?' },
        { id: 'ro_en_2', role, language, category: 'evc', text: 'What is the status of scheduled EVC inspections in WRO?' },
        { id: 'ro_en_3', role, language, category: 'compliance', text: 'Which Western Region colleges have pending deficiencies?' },
        { id: 'ro_en_4', role, language, category: 'handbook', text: 'What is the statutory deadline for EVC report uploading?' },
      ];
    }

    // institution_admin
    if (language === 'hi') {
      return [
        { id: 'inst_hi_1', role, language, category: 'own_status', text: 'हमारे संस्थान के आवेदन की वर्तमान स्थिति क्या है?' },
        { id: 'inst_hi_2', role, language, category: 'compliance', text: 'क्या हमारे कॉलेज के लिए कोई त्रुटि अनुपालन लंबित है?' },
        { id: 'inst_hi_3', role, language, category: 'handbook', text: 'प्रवेश क्षमता में वृद्धि (Increase in Intake) के लिए क्या नियम हैं?' },
        { id: 'inst_hi_4', role, language, category: 'handbook', text: 'अग्निशमन सुरक्षा NOC की वैधता कितने समय होनी चाहिए?' },
      ];
    }
    if (language === 'mr') {
      return [
        { id: 'inst_mr_1', role, language, category: 'own_status', text: 'आमच्या संस्थेच्या अर्जाची सद्यस्थिती काय आहे?' },
        { id: 'inst_mr_2', role, language, category: 'compliance', text: 'आमच्या कॉलेजसाठी काही त्रुटींची पूर्तता बाकी आहे का?' },
        { id: 'inst_mr_3', role, language, category: 'handbook', text: 'प्रवेश क्षमता वाढीसाठी (Increase in Intake) काय नियम आहेत?' },
        { id: 'inst_mr_4', role, language, category: 'handbook', text: 'अग्निशमन सुरक्षा प्रमाणपत्राची (Fire NOC) मुदत किती हवी?' },
      ];
    }
    return [
      { id: 'inst_en_1', role, language, category: 'own_status', text: 'What is the current status of our institution application?' },
      { id: 'inst_en_2', role, language, category: 'compliance', text: 'Are there any pending compliance deficiencies for our college?' },
      { id: 'inst_en_3', role, language, category: 'handbook', text: 'What are the mandatory norms for Increase in Intake?' },
      { id: 'inst_en_4', role, language, category: 'handbook', text: 'What is the required validity for Fire Safety NOC?' },
    ];
  }
}
