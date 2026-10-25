import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Shared Navigation & Portal
    'portal.title': 'AICTE SmartAssist',
    'portal.subtitle': 'National Regulatory Approval & Compliance Portal',
    'portal.tagline': 'All India Council for Technical Education • Approval Automation',
    portal_title: 'AICTE SmartAssist',
    portal_subtitle: 'National Portal',
    dashboard: 'Dashboard',
    applications: 'Applications',
    documents: 'Documents',
    passport: 'Smart Document Passport',
    compliance: 'Compliance',
    evc: 'EVC Visit',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',

    // Role Names
    'role.institution_admin': 'Institution Admin (Sakshi Sharma)',
    'role.regional_officer': 'Regional Officer (Ragini Telange)',
    'role.senior_authority': 'Senior Authority / Bureau Head (Dr. Janhavi)',
    'role.bureau_officer': 'Bureau Officer (HQ)',

    // Institution Keys
    welcome_back: 'Welcome back',
    institution_id: 'Institution ID',
    overview_title: 'Institution Overview',
    overview_desc: 'Track AICTE applications, compliance requirements, and statutory milestones.',
    new_application: 'New Application',
    upload_document: 'Upload Document',
    total_applications: 'Total Applications',
    under_scrutiny: 'Under Scrutiny',
    correction_required: 'Correction Required',
    compliance_pending: 'Compliance Pending',
    documents_expiring: 'Documents Expiring',
    expired_documents: 'Expired Documents',
    recent_applications: 'Recent Applications',
    action_required: 'Action Required',
    upcoming_deadlines: 'Upcoming Deadlines',
    smart_passport: 'Smart Document Passport',
    compliance_overview: 'Compliance Overview',
    evc_status: 'EVC Visit Status',
    health_score: 'Institution Health Score',

    // Regional Officer Keys
    'nav.scrutiny_workspace': 'Scrutiny Studio',
    'nav.evc_management': 'EVC Inspection Panel',
    'nav.late_requests': 'Appeals & Condonation',
    'nav.audit_ledger': 'Regulatory Audit Trail',

    // Senior Authority Navigation & KPIs
    'nav.dashboard': 'National Oversight Dashboard',
    'nav.applications': 'All Applications',
    'nav.regional_analytics': 'Regional Alert Map & Delay Intelligence',
    'nav.compliance_alerts': 'Compliance Alerts',
    'nav.evc_monitoring': 'EVC Inspection Tracker',
    'nav.action_centre': 'Escalation Action Centre',
    'nav.audit_logs': 'Statutory Audit Trail',
    'nav.reports': 'Executive Statutory Reports',

    'kpi.total': 'Total Applications',
    'kpi.pending': 'Applications Pending',
    'kpi.scrutiny': 'Under Scrutiny',
    'kpi.correction': 'Requiring Correction',
    'kpi.overdue': 'Overdue Statutory SLA',
    'kpi.completed': 'Completed / Approved',
    'kpi.evc_pending': 'Pending EVC Scheduling/Report',
    'kpi.compliance_pending': 'Pending Compliance Submissions',
    'kpi.expiring_docs': 'Documents Expiring Soon',
    'kpi.escalations': 'Central Escalations',

    // Actions & Statuses
    'action.filter': 'Filter Results',
    'action.reset': 'Reset Filters',
    'action.search_placeholder': 'Search by Application ID, Institute Name, or Code...',
    'action.export': 'Export Report (CSV/PDF)',
    'action.refresh': 'Refresh Data',
    'action.view_case': 'View Case Record',
    'action.reassign': 'Reassign Officer',
    'action.follow_up': 'Send Official Follow-Up',
    'action.approve': 'Statutory Approval',
    'action.reject': 'Reject Application',

    'status.all': 'All Statuses',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.under_scrutiny': 'Under Scrutiny',
    'status.deficiency': 'Deficiency Communicated',
    'status.pending_hq': 'Pending HQ Approval',

    // Analytics & Maps
    'analytics.stages_title': 'Applications by Processing Stage',
    'analytics.trends_title': 'Pending vs Completed Monthly Volume',
    'analytics.regional_overdue': 'Overdue Cases by Regional Office',
    'analytics.evc_breakdown': 'EVC Inspection & Reporting Status',
    'analytics.compliance_summary': 'Compliance & Document Expiry Health',
    'analytics.processing_time': 'Average Processing Cycle Time (Days)',

    'map.title': 'Regional Alert Map & Geospatial Intelligence',
    'map.layer_pendency': 'Application Pendency',
    'map.layer_overdue': 'Overdue Applications',
    'map.layer_evc': 'EVC Scheduling & Reporting',
    'map.layer_compliance': 'Compliance Submissions',
    'map.layer_expiring_docs': 'Expiring & Expired Documents',
    'map.legend_green': 'Within Timeline / Normal',
    'map.legend_amber': 'Deadline Approaching / Moderate',
    'map.legend_red': 'Overdue SLA / Critical Alert',
    'map.legend_grey': 'No Records / Inactive',
    'map.reset_view': 'Reset India View',
    'map.switch_to_table': 'Accessible Tabular View',
    'map.switch_to_map': 'Interactive Map View',
    'delay.title': 'Delay Intelligence & Bottleneck Diagnosis',
    'delay.bottleneck_title': 'Processing Stage Bottlenecks vs Statutory SLA',
    'delay.evc_title': 'EVC Scheduling & Inspection Bottlenecks',
    'delay.workload_title': 'Regional Workload & Delinquency Comparison',
    'risk.title': 'Transparent Rule-Based Risk Indicators',
    'risk.subtitle': 'Statutory APH 2026-27 Rule Detection (Non-ML Explainable Evidence)',

    // Chatbot
    'chatbot.title': 'AICTE SmartAssist Copilot',
    'chatbot.subtitle': 'Multilingual Regulatory & Case Assistant',
    'chatbot.clear_history': 'Clear Conversation History',
    'chatbot.suggested_questions': 'Suggested Questions',
    'chatbot.verified_sources': 'Verified Statutory Sources',
    'chatbot.listen': 'Listen',
    'chatbot.stop': 'Stop',
    'chatbot.open_case': 'Open Case',
    'chatbot.input_placeholder': 'Ask a question in English, Hindi, or Marathi...',
  },
  hi: {
    'portal.title': 'एआईसीटीई स्मार्टअसिस्ट',
    'portal.subtitle': 'राष्ट्रीय नियामक अनुमोदन एवं अनुपालन पोर्टल',
    'portal.tagline': 'अखिल भारतीय तकनीकी शिक्षा परिषद • अनुमोदन स्वचालन',
    portal_title: 'एआईसीटीई स्मार्टअसिस्ट',
    portal_subtitle: 'राष्ट्रीय पोर्टल',
    dashboard: 'डैशबोर्ड',
    applications: 'आवेदन',
    documents: 'दस्तावेज़',
    passport: 'स्मार्ट दस्तावेज़ पासपोर्ट',
    compliance: 'अनुपालन',
    evc: 'ईवीसी निरीक्षण',
    notifications: 'सूचनाएं',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    'role.institution_admin': 'संस्थान प्रशासक (साक्षी शर्मा)',
    'role.regional_officer': 'क्षेत्रीय अधिकारी (रागिनी तेलंगे)',
    'role.senior_authority': 'वरिष्ठ प्राधिकारी (डॉ. जान्हवी)',
    'role.bureau_officer': 'ब्यूरो अधिकारी (मुख्यालय)',
    welcome_back: 'वापसी पर स्वागत है',
    institution_id: 'संस्थान आईडी',
    overview_title: 'संस्थान विहंगावलोकन',
    overview_desc: 'अपने एआईसीटीई आवेदनों और महत्वपूर्ण समय-सीमाओं को ट्रैक करें।',
    new_application: 'नया आवेदन',
    upload_document: 'दस्तावेज़ अपलोड करें',
    total_applications: 'कुल आवेदन',
    under_scrutiny: 'जांच के अधीन',
    correction_required: 'सुधार आवश्यक',
    compliance_pending: 'अनुपालन लंबित',
    documents_expiring: 'जल्द समाप्त होने वाले दस्तावेज़',
    expired_documents: 'समाप्त हो चुके दस्तावेज़',
    recent_applications: 'हालिया आवेदन',
    action_required: 'आवश्यक कार्रवाई',
    upcoming_deadlines: 'आगामी समय-सीमाएं',
    smart_passport: 'स्मार्ट दस्तावेज़ पासपोर्ट',
    compliance_overview: 'अनुपालन समीक्षा',
    evc_status: 'ईवीसी निरीक्षण स्थिति',
    health_score: 'संस्थान स्वास्थ्य स्कोर',

    'nav.scrutiny_workspace': 'दस्तावेज़ जांच कक्ष',
    'nav.evc_management': 'ईवीसी समिति प्रबंधन',
    'nav.late_requests': 'अपील एवं विलंब समीक्षा',
    'nav.audit_ledger': 'नियामक ऑडिट ट्रेल',

    'nav.dashboard': 'वरिष्ठ प्राधिकरण डैशबोर्ड',
    'nav.applications': 'सभी आवेदन',
    'nav.regional_analytics': 'क्षेत्रीय विश्लेषण व मानचित्र',
    'nav.compliance_alerts': 'अनुपालन चेतावनी',
    'nav.evc_monitoring': 'ईवीसी निरीक्षण ट्रैकर',
    'nav.action_centre': 'त्वरित कार्रवाई केंद्र',
    'nav.audit_logs': 'सांविधिक ऑडिट ट्रेल',
    'nav.reports': 'कार्यकारी रिपोर्ट',

    'kpi.total': 'कुल आवेदन',
    'kpi.pending': 'लंबित आवेदन',
    'kpi.scrutiny': 'जांच के अधीन',
    'kpi.correction': 'सुधार आवश्यक',
    'kpi.overdue': 'समय सीमा पार आवेदन',
    'kpi.completed': 'पूर्ण / स्वीकृत आवेदन',
    'kpi.evc_pending': 'लंबित ईवीसी निर्धारण / रिपोर्ट',
    'kpi.compliance_pending': 'लंबित अनुपालन प्रस्तुतियां',
    'kpi.expiring_docs': 'शीघ्र समाप्त होने वाले दस्तावेज़',
    'kpi.escalations': 'अतिदेय मामले (एस्केलेशन)',

    'action.filter': 'फ़िल्टर लागू करें',
    'action.reset': 'फ़िल्टर रीसेट',
    'action.search_placeholder': 'आवेदन संख्या, संस्थान का नाम या कोड खोजें...',
    'action.export': 'रिपोर्ट निर्यात करें',
    'action.refresh': 'डेटा रीफ्रेश करें',
    'action.view_case': 'केस रिकॉर्ड देखें',
    'action.reassign': 'अधिकारी पुनः सौंपें',
    'action.follow_up': 'आधिकारिक अनुवर्ती भेजें',
    'action.approve': 'सांविधिक अनुमोदन',
    'action.reject': 'आवेदन अस्वीकार करें',

    'status.all': 'सभी स्थितियां',
    'status.approved': 'स्वीकृत',
    'status.rejected': 'अस्वीकृत',
    'status.under_scrutiny': 'जांच में',
    'status.deficiency': 'त्रुटि सूचित',
    'status.pending_hq': 'मुख्यालय अनुमोदन प्रतीक्षित',

    'analytics.stages_title': 'प्रसंस्करण चरण के अनुसार आवेदन',
    'analytics.trends_title': 'लंबित बनाम पूर्ण मासिक रुझान',
    'analytics.regional_overdue': 'क्षेत्रीय कार्यालय अनुसार अतिदेय मामले',
    'analytics.evc_breakdown': 'ईवीसी निरीक्षण एवं रिपोर्ट स्थिति',
    'analytics.compliance_summary': 'अनुपालन एवं दस्तावेज़ वैधता स्थिति',
    'analytics.processing_time': 'औसत प्रसंस्करण समय (दिन)',

    'map.title': 'क्षेत्रीय चेतावनी मानचित्र एवं भू-स्थानिक विश्लेषण',
    'map.layer_pendency': 'आवेदन प्रलंबन',
    'map.layer_overdue': 'अतिदेय आवेदन (SLA)',
    'map.layer_evc': 'ईवीसी निर्धारण एवं रिपोर्ट',
    'map.layer_compliance': 'अनुपालन प्रस्तुतियां',
    'map.layer_expiring_docs': 'कालबाह्य होने वाले दस्तावेज़',
    'map.legend_green': 'समय सीमा के भीतर (सामान्य)',
    'map.legend_amber': 'समय सीमा समीप (मध्यम)',
    'map.legend_red': 'अतिदेय / तत्काल कार्रवाई आवश्यक',
    'map.legend_grey': 'कोई डेटा नहीं',
    'map.reset_view': 'भारत दृश्य रीसेट करें',
    'map.switch_to_table': 'सुलभ सारणीबद्ध दृश्य',
    'map.switch_to_map': 'इंटरैक्टिव मानचित्र दृश्य',
    'delay.title': 'विलंब विश्लेषण एवं चरण व्यवधान निदान',
    'delay.bottleneck_title': 'प्रसंस्करण चरण व्यवधान बनाम सांविधिक SLA',
    'delay.evc_title': 'ईवीसी निर्धारण एवं निरीक्षण विलंब',
    'delay.workload_title': 'क्षेत्रीय कार्यभार एवं उल्लंघन तुलना',
    'risk.title': 'पारदर्शी नियम-आधारित जोखिम संकेतक',
    'risk.subtitle': 'सांविधिक APH 2026-27 नियम पहचान (स्पष्टीकरणीय साक्ष्य)',

    'chatbot.title': 'एआईसीटीई स्मार्टअसिस्ट सह-पायलट',
    'chatbot.subtitle': 'बहुभाषी वैधानिक एवं प्रकरण सहायक',
    'chatbot.clear_history': 'बातचीत इतिहास साफ़ करें',
    'chatbot.suggested_questions': 'सुझाए गए प्रश्न',
    'chatbot.verified_sources': 'सत्यापित वैधानिक स्रोत',
    'chatbot.listen': 'सुनें',
    'chatbot.stop': 'रोकें',
    'chatbot.open_case': 'केस खोलें',
    'chatbot.input_placeholder': 'अंग्रेजी, हिंदी या मराठी में अपना प्रश्न पूछें...',
  },
  mr: {
    'portal.title': 'एआयसीटीई स्मार्टअसिस्ट',
    'portal.subtitle': 'राष्ट्रीय नियामक मान्यता आणि अनुपालन पोर्टल',
    'portal.tagline': 'अखिल भारतीय तंत्रशिक्षण परिषद • मान्यता ऑटोमेशन',
    portal_title: 'एआयसीटीई स्मार्टअसिस्ट',
    portal_subtitle: 'राष्ट्रीय पोर्टल',
    dashboard: 'डॅशबोर्ड',
    applications: 'अर्ज',
    documents: 'कागदपत्रे',
    passport: 'स्मार्ट डॉक्युमेंट पासपोर्ट',
    compliance: 'अनुपालन',
    evc: 'ईव्हीसी भेट',
    notifications: 'सूचना',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्ज',
    'role.institution_admin': 'संस्था प्रशासक (साक्षी शर्मा)',
    'role.regional_officer': 'प्रादेशिक अधिकारी (रागिनी तेलंगे)',
    'role.senior_authority': 'वरिष्ठ अधिकारी (डॉ. जान्हवी)',
    'role.bureau_officer': 'ब्युरो अधिकारी (मुख्यालय)',
    welcome_back: 'पुन्हा स्वागत आहे',
    institution_id: 'संस्था आयडी',
    overview_title: 'संस्था आढावा',
    overview_desc: 'आपले अर्ज, अनुपालन आवश्यकता आणि मुदती ट्रॅक करा.',
    new_application: 'नवीन अर्ज',
    upload_document: 'कागदपत्र अपलोड करा',
    total_applications: 'एकूण अर्ज',
    under_scrutiny: 'छाननी अंतर्गत',
    correction_required: 'दुरुस्ती आवश्यक',
    compliance_pending: 'अनुपालन प्रलंबित',
    documents_expiring: 'मुदत संपत असलेली कागदपत्रे',
    expired_documents: 'मुदत संपलेली कागदपत्रे',
    recent_applications: 'अलीकडील अर्ज',
    action_required: 'तातडीची कारवाई आवश्यक',
    upcoming_deadlines: 'आगामी मुदती',
    smart_passport: 'स्मार्ट डॉक्युमेंट पासपोर्ट',
    compliance_overview: 'अनुपालन प्रगती',
    evc_status: 'ईव्हीसी तपासणी स्थिती',
    health_score: 'संस्था आरोग्य स्कोअर',

    'nav.scrutiny_workspace': 'कागदपत्र छाननी कक्ष',
    'nav.evc_management': 'ईव्हीसी समिती व्यवस्थापन',
    'nav.late_requests': 'विलंब माफी व अपील',
    'nav.audit_ledger': 'नियामक ऑडिट लेजर',

    'nav.dashboard': 'वरिष्ठ प्राधिकरण डॅशबोर्ड',
    'nav.applications': 'सर्व अर्ज',
    'nav.regional_analytics': 'प्रादेशिक विश्लेषण व नकाशा',
    'nav.compliance_alerts': 'अनुपालन सूचना',
    'nav.evc_monitoring': 'ईव्हीसी तपासणी ट्रॅकर',
    'nav.action_centre': 'त्वरित कृती केंद्र',
    'nav.audit_logs': 'ऑडिट नोंदवही',
    'nav.reports': 'कार्यकारी अहवाल',

    'kpi.total': 'एकूण अर्ज',
    'kpi.pending': 'प्रलंबित अर्ज',
    'kpi.scrutiny': 'छाननी अंतर्गत',
    'kpi.correction': 'दुरुस्ती आवश्यक',
    'kpi.overdue': 'मुदत संपलेले अर्ज (SLA)',
    'kpi.completed': 'पूर्ण / मंजूर अर्ज',
    'kpi.evc_pending': 'प्रलंबित ईव्हीसी नियोजन / अहवाल',
    'kpi.compliance_pending': 'प्रलंबित अनुपालन सादरता',
    'kpi.expiring_docs': 'लवकरच कालबाह्य होणारी कागदपत्रे',
    'kpi.escalations': 'तातडीची प्रकरणे (एस्केलेशन)',

    'action.filter': 'फिल्टर करा',
    'action.reset': 'फिल्टर रीसेट',
    'action.search_placeholder': 'अर्ज क्रमांक, संस्था किंवा कोड शोधा...',
    'action.export': 'अहवाल डाउनलोड करा',
    'action.refresh': 'ताजे करा',
    'action.view_case': 'प्रकरण तपशील पहा',
    'action.reassign': 'अधिकारी पुन्हा नियुक्त करा',
    'action.follow_up': 'अधिकृत पाठपुरावा पाठवा',
    'action.approve': 'वैधानिक मंजुरी',
    'action.reject': 'अर्ज नाकारा',

    'status.all': 'सर्व स्थिती',
    'status.approved': 'मंजूर',
    'status.rejected': 'नाकारले',
    'status.under_scrutiny': 'छाननी सुरू',
    'status.deficiency': 'त्रुटी कळवली',
    'status.pending_hq': 'मुख्यालय मंजुरी प्रलंबित',

    'analytics.stages_title': 'प्रक्रिया टप्प्यानुसार अर्ज',
    'analytics.trends_title': 'प्रलंबित विरुद्ध पूर्ण मासिक कल',
    'analytics.regional_overdue': 'प्रादेशिक कार्यालयानुसार थकीत प्रकरणे',
    'analytics.evc_breakdown': 'ईव्हीसी तपासणी आणि अहवाल स्थिती',
    'analytics.compliance_summary': 'अनुपालन आणि दस्तऐवज वैधता',
    'analytics.processing_time': 'सरासरी प्रक्रिया कालावधी (दिवस)',

    'map.title': 'प्रादेशिक सतर्कता नकाशा आणि विश्लेषण',
    'map.layer_pendency': 'अर्ज प्रलंबन',
    'map.layer_overdue': 'मुदत संपलेले अर्ज (SLA)',
    'map.layer_evc': 'ईव्हीसी नियोजन आणि अहवाल',
    'map.layer_compliance': 'अनुपालन सादरता',
    'map.layer_expiring_docs': 'कालबाह्य होणारी कागदपत्रे',
    'map.legend_green': 'मुदतीच्या आत (सामान्य)',
    'map.legend_amber': 'मुदत संपत आली आहे (मध्यम)',
    'map.legend_red': 'मुदत संपली / त्वरित कारवाई आवश्यक',
    'map.legend_grey': 'माहिती उपलब्ध नाही',
    'map.reset_view': 'भारत नकाशा पूर्ववत करा',
    'map.switch_to_table': 'तक्ता स्वरूप (अ‍ॅक्सेसिबल)',
    'map.switch_to_map': 'नकाशा स्वरूप',
    'delay.title': 'विलंब विश्लेषण व टप्पा अडथळा निदान',
    'delay.bottleneck_title': 'प्रक्रिया टप्पा अडथळे वि वैधानिक SLA',
    'delay.evc_title': 'ईव्हीसी नियोजन आणि तपासणी अडथळे',
    'delay.workload_title': 'प्रादेशिक कार्यभार व विलंब तुलना',
    'risk.title': 'पारदर्शक नियम-आधारित जोखीम निर्देशक',
    'risk.subtitle': 'वैधानिक APH 2026-27 नियम शोध (स्पष्टीकरणात्मक पुरावे)',

    'chatbot.title': 'एआयसीटीई स्मार्टअसिस्ट सह-पायलट',
    'chatbot.subtitle': 'बहुभाषिक वैधानिक व प्रकरण सहाय्यक',
    'chatbot.clear_history': 'संभाषण इतिहास साफ करा',
    'chatbot.suggested_questions': 'सुचवलेले प्रश्न',
    'chatbot.verified_sources': 'सत्यापित वैधानिक स्रोत',
    'chatbot.listen': 'ऐका',
    'chatbot.stop': 'थांबवा',
    'chatbot.open_case': 'केस उघडा',
    'chatbot.input_placeholder': 'इंग्रजी, हिंदी किंवा मराठीत प्रश्न विचारा...',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return (localStorage.getItem('aicte_lang') as Language) || 'en';
      }
    } catch (err) {
      console.warn('Could not read aicte_lang from localStorage:', err);
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('aicte_lang', lang);
      }
    } catch (err) {
      console.warn('Could not write aicte_lang to localStorage:', err);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
