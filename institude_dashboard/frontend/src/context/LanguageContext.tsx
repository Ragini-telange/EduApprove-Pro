import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    portal_title: 'AICTE SmartAssist',
    portal_subtitle: 'Institution Portal',
    welcome_back: 'Welcome back',
    dashboard: 'Dashboard',
    applications: 'Applications',
    documents: 'Documents',
    passport: 'Smart Document Passport',
    compliance: 'Compliance',
    evc: 'EVC Visit',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',
    institution_id: 'Institution ID',
    overview_title: 'Institution Overview',
    overview_desc: 'Track your AICTE applications, compliance requirements and important deadlines from one place.',
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
    ai_assistant_title: 'Need help with your application or compliance requirements?',
    ask_smartassist: 'Ask SmartAssist...',
    view_all: 'View All',
    search_placeholder: 'Search applications, certificates, regulations...',
  },
  hi: {
    portal_title: 'एआईसीटीई स्मार्टअसिस्ट',
    portal_subtitle: 'संस्थान पोर्टल',
    welcome_back: 'वापसी पर स्वागत है',
    dashboard: 'डैशबोर्ड',
    applications: 'आवेदन',
    documents: 'दस्तावेज़',
    passport: 'स्मार्ट दस्तावेज़ पासपोर्ट',
    compliance: 'अनुपालन (कम्प्लायंस)',
    evc: 'ईवीसी समिति दौरा',
    notifications: 'अधिसूचनाएं',
    profile: 'संस्थान प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    institution_id: 'संस्थान आईडी',
    overview_title: 'संस्थान अवलोकन',
    overview_desc: 'अपने एआईसीटीई आवेदनों, अनुपालन आवश्यकताओं और महत्वपूर्ण समय-सीमाओं को एक ही स्थान से ट्रैक करें।',
    new_application: 'नया आवेदन',
    upload_document: 'दस्तावेज़ अपलोड करें',
    total_applications: 'कुल आवेदन',
    under_scrutiny: 'जांच के अधीन',
    correction_required: 'संशोधन आवश्यक',
    compliance_pending: 'अनुपालन लंबित',
    documents_expiring: 'दस्तावेज़ समाप्त हो रहे हैं',
    expired_documents: 'समाप्त दस्तावेज़',
    recent_applications: 'हालिया आवेदन',
    action_required: 'आवश्यक कार्रवाई',
    upcoming_deadlines: 'आगामी समय सीमा',
    smart_passport: 'स्मार्ट दस्तावेज़ पासपोर्ट',
    compliance_overview: 'अनुपालन अवलोकन',
    evc_status: 'ईवीसी निरीक्षण स्थिति',
    health_score: 'संस्थान स्वास्थ्य स्कोर',
    ai_assistant_title: 'अपने आवेदन या अनुपालन आवश्यकताओं के लिए सहायता चाहिए?',
    ask_smartassist: 'स्मार्टअसिस्ट से पूछें...',
    view_all: 'सभी देखें',
    search_placeholder: 'आवेदन, प्रमाणपत्र या विनियम खोजें...',
  },
  mr: {
    portal_title: 'एआयसीटीई स्मार्टअसिस्ट',
    portal_subtitle: 'संस्था पोर्टल',
    welcome_back: 'पुन्हा स्वागत आहे',
    dashboard: 'डॅशबोर्ड',
    applications: 'अर्ज',
    documents: 'कागदपत्रे',
    passport: 'स्मार्ट दस्तऐवज पासपोर्ट',
    compliance: 'अनुपालन पूर्तता',
    evc: 'ईव्हीसी समिती भेट',
    notifications: 'सूचना',
    profile: 'संस्था माहिती',
    settings: 'सेटिंग्ज',
    institution_id: 'संस्था ओळख क्रमांक (ID)',
    overview_title: 'संस्था विहंगावलोकन',
    overview_desc: 'आपले एआयसीटीई अर्ज, अनुपालन आवश्यकता आणि महत्त्वाच्या मुदती एकाच ठिकाणाहून तपासा.',
    new_application: 'नवीन अर्ज',
    upload_document: 'दस्तऐवज अपलोड करा',
    total_applications: 'एकूण अर्ज',
    under_scrutiny: 'छाननी अंतर्गत',
    correction_required: 'दुरुस्ती आवश्यक',
    compliance_pending: 'अनुपालन प्रलंबित',
    documents_expiring: 'मुदत संपत असलेले',
    expired_documents: 'मुदत संपलेले दस्तऐवज',
    recent_applications: 'अलीकडील अर्ज',
    action_required: 'तात्काळ कारवाई आवश्यक',
    upcoming_deadlines: 'आगामी अंतिम मुदती',
    smart_passport: 'स्मार्ट दस्तऐवज पासपोर्ट',
    compliance_overview: 'अनुपालन आढावा',
    evc_status: 'ईव्हीसी भेट स्थिती',
    health_score: 'संस्था आरोग्य निर्देशांक',
    ai_assistant_title: 'आपल्या अर्जाबाबत किंवा अनुपालनाबाबत मदत हवी आहे का?',
    ask_smartassist: 'स्मार्टअसिस्टला विचारा...',
    view_all: 'सर्व पहा',
    search_placeholder: 'अर्ज, प्रमाणपत्रे किंवा नियम शोधा...',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
