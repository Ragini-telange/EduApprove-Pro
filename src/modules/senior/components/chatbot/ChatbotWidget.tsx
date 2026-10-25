import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useAuth as useRootAuth } from '../../../../app/providers/AuthProvider';
import { useLanguage } from '../../../../app/providers/LanguageProvider';
import { ChatbotService } from '../../services/chatbotService';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import type { ChatMessage, SuggestedPrompt, LinkedCaseInfo } from '../../types/chatbot';
import type { UserRole as SeniorUserRole } from '../../types/authority';
import {
  X,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Info
} from 'lucide-react';

interface ChatbotWidgetProps {
  onSelectCase?: (applicationId: string) => void;
  isOpenByDefault?: boolean;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  onSelectCase,
  isOpenByDefault = false,
}) => {
  const rootAuth = useRootAuth();
  const user = rootAuth.user;
  const role: SeniorUserRole =
    rootAuth.role === 'senior_authority'
      ? 'bureau_officer'
      : rootAuth.role === 'regional_officer'
      ? 'regional_officer'
      : 'institution_admin';
  const { language, setLanguage, t } = useLanguage();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [expandedSourcesMessageId, setExpandedSourcesMessageId] = useState<string | null>(null);

  // Initialize conversation from sessionStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('aicte_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.warn('Could not read chat history from sessionStorage:', err);
    }
    return [];
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Voice Assistant Hook
  const {
    recognitionState,
    synthesisState,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    replaySpeech,
  } = useVoiceAssistant({
    language,
    onTranscriptRecognized: (transcript) => {
      setInputText(transcript);
    },
  });

  // Save conversation to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('aicte_chat_messages', JSON.stringify(messages));
    } catch (err) {
      console.warn('Could not save chat message to sessionStorage:', err);
    }
  }, [messages]);

  // Initial greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeText = language === 'hi'
        ? `नमस्ते, **${user?.name || 'अधिकारी'}**। मैं आपका **AICTE SmartAssist बहुभाषी सह-पायलट** हूँ।\nआप वैधानिक अनुमोदन प्रक्रिया (APH 2026-27), अतिदेय मामलों, EVC निरीक्षणों या अनुपालन समयसीमाओं के संबंध में कोई भी प्रश्न पूछ सकते हैं।`
        : language === 'mr'
        ? `नमस्कार, **${user?.name || 'अधिकारी'}**। मी आपला **AICTE SmartAssist बहुभाषिक सह-पायलट** आहे.\nआपण वैधानिक मान्यता प्रक्रिया (APH 2026-27), थकीत प्रकरणे, EVC तपासणी किंवा अनुपालन मुदतीबाबत प्रश्न विचारू शकता.`
        : `Welcome, **${user?.name || 'Officer'}**. I am your **AICTE SmartAssist Multilingual Copilot**.\nYou can query verified approval records, regional overdue statistics, EVC committee inspection SLAs, or APH 2026-27 regulatory norms.`;

      const welcomeMsg: ChatMessage = {
        id: `msg_welcome_${Date.now()}`,
        sender: 'assistant',
        text: welcomeText,
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [
          {
            id: 'src_aph_handbook_intro',
            type: 'handbook_clause',
            title: 'AICTE Approval Process Handbook (APH 2026-27)',
            reference: 'Official Gazette Notification, AICTE Act 1987',
            snippet: 'All regulatory answers and delay analyses are grounded in statutory AICTE regulations.',
          }
        ],
      };
      setMessages([welcomeMsg]);
    }
  }, [language, user, messages.length]);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Suggested prompts for current role and language
  const suggestedPrompts: SuggestedPrompt[] = ChatbotService.getSuggestedPrompts(role, language);

  const handleSendMessage = async (textToSend?: string) => {
    const rawQuestion = (textToSend || inputText).trim();
    if (!rawQuestion || isThinking) return;

    // Stop microphone if currently recording
    if (recognitionState.isListening) {
      stopListening();
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg_usr_${Date.now()}`,
      sender: 'user',
      text: rawQuestion,
      language,
      timestamp: nowStr,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const response = await ChatbotService.queryAssistant(rawQuestion, {
        userRole: role,
        userName: user?.name || 'Authorized Officer',
        userRegion: (user as any)?.regionalOffice || (user as any)?.region || 'Western Region',
        language,
      });

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        text: response.messageText,
        language: response.language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        linkedCases: response.linkedCases,
        isInsufficientEvidence: response.isInsufficientEvidence,
        isPermissionRestricted: response.isPermissionRestricted,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: language === 'hi'
          ? 'त्रुटि: अनुरोध संसाधित करने में असमर्थ। कृपया पुनः प्रयास करें।'
          : language === 'mr'
          ? 'त्रुटी: विनंतीवर प्रक्रिया करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.'
          : 'Service Alert: Unable to communicate with the regulatory knowledge engine. Please check system connectivity.',
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearHistory = () => {
    stopSpeaking();
    sessionStorage.removeItem('aicte_chat_messages');
    setMessages([]);
  };

  const handleCaseClick = (caseItem: LinkedCaseInfo) => {
    if (onSelectCase) {
      onSelectCase(caseItem.applicationId);
    }
  };

  return (
    <>
      {/* Floating Trigger Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-aicte-900 to-aicte-800 hover:from-slate-950 hover:to-aicte-900 text-white p-3.5 rounded-full shadow-2xl border-2 border-amber-400 flex items-center gap-3 transition-all duration-300 transform hover:scale-105 group"
          title="AICTE SmartAssist Copilot (Voice & Text Assistant)"
          aria-label="Open AICTE SmartAssist Assistant"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-inner">
              <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="text-left hidden sm:block pr-1">
            <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              AICTE SmartAssist
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded border border-amber-400/30">
                AI
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium">
              Voice & Text Copilot
            </div>
          </div>
        </button>
      )}

      {/* Main Chat Assistant Modal / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="AICTE SmartAssist Multilingual Copilot"
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-slate-50 border border-slate-300 shadow-2xl rounded-2xl overflow-hidden font-sans ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[440px] h-[640px] max-h-[90vh]'
          }`}
        >
          {/* Top Header */}
          <header className="bg-gradient-to-r from-slate-950 via-aicte-900 to-aicte-800 text-white px-4 py-3 border-b-2 border-amber-400 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Sparkles className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black tracking-tight text-white">
                    AICTE SmartAssist Copilot
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live APH
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1.5">
                  <span>{user?.name ? user.name.split(' ')[0] : 'Officer'}</span>
                  <span>•</span>
                  <span className="text-amber-300 font-medium">
                    {role === 'bureau_officer' ? 'Central HQ' : role === 'regional_officer' ? 'Regional' : 'Institution'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Language Selector, Clear, Expand, Close */}
            <div className="flex items-center space-x-1.5">
              {/* Language Selector Pills */}
              <div className="bg-slate-900/80 rounded-lg p-0.5 border border-slate-700 flex items-center text-[10px] font-bold">
                <button
                  onClick={() => startTransition(() => setLanguage('en'))}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    language === 'en' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  onClick={() => startTransition(() => setLanguage('hi'))}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    language === 'hi' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="हिंदी में बदलें"
                >
                  हिं
                </button>
                <button
                  onClick={() => startTransition(() => setLanguage('mr'))}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    language === 'mr' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                  title="मराठीत बदला"
                >
                  मरा
                </button>
              </div>

              {/* Clear History */}
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title={t('chatbot.clear_history') || 'Clear Conversation History'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                title={isExpanded ? 'Restore Size' : 'Expand Fullscreen'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Drawer */}
              <button
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-rose-900/60 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Active Listening / Speaking Banner */}
          {recognitionState.isListening && (
            <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800 animate-pulse shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-ping"></span>
                <span className="font-bold">
                  {language === 'hi' ? 'माइक्रोफ़ोन सुन रहा है... बोलिए' : language === 'mr' ? 'मायक्रोफोन ऐकत आहे... बोला' : 'Listening... Speak in your chosen language'}
                </span>
              </div>
              <button
                onClick={stopListening}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded shadow-xs"
              >
                Stop
              </button>
            </div>
          )}

          {synthesisState.isSpeaking && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-amber-700 animate-bounce" />
                <span className="font-semibold">
                  {language === 'hi' ? 'उत्तर सुनाया जा रहा है...' : language === 'mr' ? 'उत्तर वाचून दाखवले जात आहे...' : 'Reading response aloud...'}
                </span>
              </div>
              <button
                onClick={stopSpeaking}
                className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5" />
                Stop Audio
              </button>
            </div>
          )}

          {recognitionState.error && (
            <div className="bg-amber-100 text-amber-900 px-4 py-1.5 text-xs flex items-center justify-between">
              <span>{recognitionState.error}</span>
              <button
                onClick={() => startListening()}
                className="font-bold underline text-[11px]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Conversation Stream */}
          <div
            className="flex-1 p-4 overflow-y-auto space-y-4 text-xs"
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSourcesExpanded = expandedSourcesMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  {/* Sender label & Timestamp */}
                  <div className="text-[10px] text-slate-400 px-1 flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-600">
                      {isUser ? user?.name || 'You' : 'AICTE SmartAssist'}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-xs leading-relaxed ${
                      isUser
                        ? 'bg-aicte-900 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {/* Insufficient Evidence Warning Banner */}
                    {msg.isInsufficientEvidence && (
                      <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-amber-800 text-[11px]">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>{language === 'hi' ? 'सत्यापित साक्ष्य सीमा' : language === 'mr' ? 'वैधानिक पुरावा मर्यादा' : 'Grounded Evidence Guard'}:</strong>{' '}
                          {language === 'hi' ? 'इस प्रश्न के लिए कोई आधिकारिक अभिलेख नहीं मिला।' : language === 'mr' ? 'या प्रश्नासाठी कोणतीही अधिकृत नोंद आढळली नाही.' : 'No verified case records or handbook clauses found.'}
                        </div>
                      </div>
                    )}

                    {/* Role Permission Guard Banner */}
                    {msg.isPermissionRestricted && (
                      <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-800 text-[11px]">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>{language === 'hi' ? 'अधिकार क्षेत्र प्रतिबंध' : language === 'mr' ? 'अधिकार मर्यादा' : 'Role-Based Access Guard'}:</strong>{' '}
                          {language === 'hi' ? 'डेटा गोपनीयता नियमों के तहत पहुंच सीमित है।' : language === 'mr' ? 'डेटा गोपनीयता नियमांनुसार प्रवेश प्रतिबंधित आहे.' : 'Data partitioned by role authority.'}
                        </div>
                      </div>
                    )}

                    {/* Message Text Body (formatted markdown-like) */}
                    <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px]">
                      {msg.text.split('\n').map((line, idx) => {
                        if (line.startsWith('•') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
                          return (
                            <div key={idx} className="pl-2 my-1">
                              {line.includes('**') ? (
                                <span dangerouslySetInnerHTML={{
                                  __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                }} />
                              ) : (
                                line
                              )}
                            </div>
                          );
                        }

                        return (
                          <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                            {line.includes('**') ? (
                              <span dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              }} />
                            ) : (
                              line
                            )}
                          </p>
                        );
                      })}
                    </div>

                    {/* Deep-Linked Application Cards (if referenced in answer) */}
                    {msg.linkedCases && msg.linkedCases.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-150 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 text-aicte-600" />
                          <span>Referenced Applications ({msg.linkedCases.length}):</span>
                        </div>
                        {msg.linkedCases.map((c) => (
                          <div
                            key={c.applicationId}
                            onClick={() => handleCaseClick(c)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-colors cursor-pointer group flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-[11px] text-aicte-900 group-hover:text-aicte-600 flex items-center gap-1.5 truncate">
                                <span>{c.applicationNumber}</span>
                                {c.isOverdue && (
                                  <span className="text-[9px] bg-rose-100 text-rose-800 px-1 rounded font-bold">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-600 truncate">
                                {c.institutionName} • {c.stage}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-aicte-600 shrink-0 group-hover:underline flex items-center gap-0.5">
                              Open Case &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Source References Accordion */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setExpandedSourcesMessageId(isSourcesExpanded ? null : msg.id)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-between w-full"
                        >
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            {language === 'hi' ? 'सत्यापित वैधानिक संदर्भ' : language === 'mr' ? 'सत्यापित वैधानिक संदर्भ' : 'Verified Statutory Sources'} ({msg.sources.length})
                          </span>
                          {isSourcesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isSourcesExpanded && (
                          <div className="mt-2 space-y-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px]">
                            {msg.sources.map((src) => (
                              <div key={src.id} className="border-l-2 border-amber-500 pl-2 py-0.5">
                                <div className="font-bold text-slate-800">{src.title}</div>
                                <div className="text-amber-800 font-mono text-[9px]">{src.reference}</div>
                                <div className="text-slate-600 mt-0.5">{src.snippet}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text-to-Speech Voice Controls (Only on assistant messages) */}
                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center space-x-2">
                          {synthesisState.speakingMessageId === msg.id ? (
                            <button
                              onClick={stopSpeaking}
                              className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
                              title="Stop Audio"
                            >
                              <VolumeX className="w-3 h-3 text-amber-600" />
                              <span>Stop</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => speakText(msg.text, msg.id, msg.language)}
                              className="text-slate-600 hover:text-aicte-900 font-semibold flex items-center gap-1 transition-colors"
                              title={language === 'hi' ? 'उत्तर सुनें' : language === 'mr' ? 'उत्तर ऐका' : 'Listen to Answer'}
                            >
                              <Volume2 className="w-3 h-3 text-slate-500" />
                              <span>{language === 'hi' ? 'सुनें' : language === 'mr' ? 'ऐका' : 'Listen'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => replaySpeech(msg.text, msg.id, msg.language)}
                            className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                            title="Replay Audio"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Replay</span>
                          </button>
                        </div>

                        <span className="text-[9px] text-slate-400 uppercase font-mono">
                          {msg.language.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Streaming Indicator */}
            {isThinking && (
              <div className="flex items-start space-x-2 text-xs text-slate-500 py-1">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                    <span className="text-[11px] text-slate-500 font-medium pl-1">
                      {language === 'hi'
                        ? 'APH 2026-27 और केस अभिलेखों का विश्लेषण हो रहा है...'
                        : language === 'mr'
                        ? 'APH 2026-27 व अर्ज नोंदी तपासत आहे...'
                        : 'Analyzing verified database records & APH 2026-27 norms...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Role-Based Suggested Questions Chips */}
          <div className="bg-white border-t border-slate-200 px-3 py-2 shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-amber-600" />
              <span>
                {language === 'hi' ? 'सुझाए गए प्रश्न' : language === 'mr' ? 'सुचवलेले प्रश्न' : 'Suggested Questions'} ({role.replace('_', ' ')}):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSendMessage(p.text)}
                  disabled={isThinking}
                  className="bg-slate-100 hover:bg-amber-100 hover:text-amber-950 hover:border-amber-300 text-slate-700 border border-slate-200 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all text-left truncate max-w-full"
                  title={p.text}
                >
                  {p.text}
                </button>
              ))}
            </div>
          </div>

          {/* Voice & Text Input Bar */}
          <footer className="bg-slate-100 border-t border-slate-200 p-2.5 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              {/* Voice Input Microphone Button */}
              {recognitionState.isSupported ? (
                <button
                  type="button"
                  onClick={recognitionState.isListening ? stopListening : startListening}
                  className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                    recognitionState.isListening
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse ring-2 ring-rose-400'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  }`}
                  title={recognitionState.isListening ? 'Stop Recording' : 'Voice Input (Speak in English, Hindi, or Marathi)'}
                  aria-label={recognitionState.isListening ? 'Stop microphone' : 'Start microphone'}
                >
                  {recognitionState.isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-slate-700" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-300 shrink-0 cursor-not-allowed"
                  title="Speech recognition unsupported in this browser"
                >
                  <MicOff className="w-4 h-4" />
                </button>
              )}

              {/* Textarea Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                    if (e.key === 'Escape') {
                      setIsOpen(false);
                    }
                  }}
                  rows={isExpanded ? 2 : 1}
                  placeholder={
                    language === 'hi'
                      ? 'प्रश्न लिखें या माइक दबाएं...'
                      : language === 'mr'
                      ? 'प्रश्न लिहा किंवा माइक दाबा...'
                      : 'Ask about overdue cases, EVC SLAs, intake norms...'
                  }
                  className="w-full bg-white border border-slate-300 focus:border-aicte-600 focus:ring-1 focus:ring-aicte-600 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none resize-none leading-relaxed transition-all shadow-inner"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isThinking}
                className="bg-aicte-900 hover:bg-slate-950 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2.5 rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center"
                title="Send Inquiry"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Grounded in verified records
              </span>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};
