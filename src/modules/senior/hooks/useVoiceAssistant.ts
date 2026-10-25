/**
 * Voice Assistant Hook (Speech-to-Text & Text-to-Speech)
 * AICTE SmartAssist Phase 6
 *
 * Implements:
 * - Speech-to-Text via Web Speech Recognition (en-IN, hi-IN, mr-IN)
 * - Text-to-Speech via Web SpeechSynthesis with play, pause, replay controls
 * - Graceful fallbacks for unsupported browser environments
 * - Strict rule: NEVER plays audio automatically
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Language } from '../context/LanguageContext';
import type { SpeechRecognitionState, SpeechSynthesisState } from '../types/chatbot';

export interface UseVoiceAssistantProps {
  language: Language;
  onTranscriptRecognized?: (transcript: string) => void;
}

export function useVoiceAssistant({ language, onTranscriptRecognized }: UseVoiceAssistantProps) {
  // Speech Recognition State
  const [recognitionState, setRecognitionState] = useState<SpeechRecognitionState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
  });

  // Speech Synthesis State
  const [synthesisState, setSynthesisState] = useState<SpeechSynthesisState>({
    isSpeaking: false,
    speakingMessageId: null,
    isSupported: false,
    activeLanguage: language,
  });

  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Check browser support on mount
  useEffect(() => {
    const hasSpeechRecognition = typeof window !== 'undefined' && 
      (Boolean((window as any).SpeechRecognition) || Boolean((window as any).webkitSpeechRecognition));

    const hasSpeechSynthesis = typeof window !== 'undefined' && Boolean(window.speechSynthesis);

    setRecognitionState(prev => ({ ...prev, isSupported: hasSpeechRecognition }));
    setSynthesisState(prev => ({ ...prev, isSupported: hasSpeechSynthesis }));

    if (hasSpeechSynthesis) {
      const updateVoices = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
      };
      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (abortErr) {
          console.warn('SpeechRecognition abort warning:', abortErr);
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update synthesis language when language prop changes
  useEffect(() => {
    setSynthesisState(prev => ({ ...prev, activeLanguage: language }));
  }, [language]);

  /**
   * Map internal Language code to BCP 47 Speech Recognition code
   */
  const getBcp47Locale = useCallback((lang: Language): string => {
    switch (lang) {
      case 'hi':
        return 'hi-IN';
      case 'mr':
        return 'mr-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  }, []);

  /**
   * Start Speech-to-Text Recognition
   */
  const startListening = useCallback(() => {
    if (!recognitionState.isSupported) {
      setRecognitionState(prev => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser. Please type your query.',
      }));
      return;
    }

    // Abort any existing session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (abortErr) {
        console.warn('SpeechRecognition abort existing session:', abortErr);
      }
    }

    try {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getBcp47Locale(language);

      recognition.onstart = () => {
        setRecognitionState(prev => ({
          ...prev,
          isListening: true,
          transcript: '',
          interimTranscript: '',
          error: null,
        }));
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTrans += item[0].transcript;
          } else {
            interimTrans += item[0].transcript;
          }
        }

        const currentText = finalTrans || interimTrans;
        setRecognitionState(prev => ({
          ...prev,
          transcript: currentText,
          interimTranscript: interimTrans,
        }));

        if (finalTrans && onTranscriptRecognized) {
          onTranscriptRecognized(finalTrans.trim());
        }
      };

      recognition.onerror = (event: any) => {
        let errMessage = 'Voice input error occurred.';
        if (event.error === 'not-allowed') {
          errMessage = 'Microphone permission was denied. Please allow microphone access in your browser.';
        } else if (event.error === 'no-speech') {
          errMessage = 'No speech was detected. Please try speaking again.';
        } else if (event.error === 'network') {
          errMessage = 'Network error while attempting speech recognition.';
        }

        setRecognitionState(prev => ({
          ...prev,
          isListening: false,
          error: errMessage,
        }));
      };

      recognition.onend = () => {
        setRecognitionState(prev => ({
          ...prev,
          isListening: false,
        }));
      };

      recognition.start();
    } catch (err: any) {
      setRecognitionState(prev => ({
        ...prev,
        isListening: false,
        error: err?.message || 'Could not initiate microphone recognition.',
      }));
    }
  }, [language, getBcp47Locale, onTranscriptRecognized, recognitionState.isSupported]);

  /**
   * Stop Speech-to-Text Recognition
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (stopErr) {
        console.warn('SpeechRecognition stop:', stopErr);
      }
    }
    setRecognitionState(prev => ({
      ...prev,
      isListening: false,
    }));
  }, []);

  /**
   * Play text aloud via Text-to-Speech (speechSynthesis)
   */
  const speakText = useCallback((text: string, messageId: string, overrideLang?: Language) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSynthesisState(prev => ({
        ...prev,
        isSpeaking: false,
        speakingMessageId: null,
      }));
      return;
    }

    // Clean text of markdown asterisks and bullets for smooth acoustic enunciation
    const cleanSpeech = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/•/g, '')
      .replace(/&bull;/g, '')
      .replace(/AICTE\/2026-27\/1-/g, 'AICTE Application One ')
      .trim();

    const targetLang = overrideLang || language;
    const locale = getBcp47Locale(targetLang);

    // Cancel current speech if active
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = locale;
    utterance.rate = 0.95; // Steady, official governance cadence
    utterance.pitch = 1.0;

    // Select the best available native voice for this locale
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    let bestVoice: SpeechSynthesisVoice | null = null;

    if (targetLang === 'hi') {
      bestVoice = voices.find(v => v.lang === 'hi-IN' || v.name.toLowerCase().includes('hindi')) || null;
    } else if (targetLang === 'mr') {
      bestVoice = voices.find(v => v.lang === 'mr-IN' || v.name.toLowerCase().includes('marathi')) ||
                  voices.find(v => v.lang === 'hi-IN') || null;
    } else {
      bestVoice = voices.find(v => v.lang === 'en-IN') || 
                  voices.find(v => v.lang === 'en-US' || v.lang.startsWith('en')) || null;
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      setSynthesisState({
        isSpeaking: true,
        speakingMessageId: messageId,
        isSupported: true,
        activeLanguage: targetLang,
      });
    };

    utterance.onend = () => {
      setSynthesisState(prev => ({
        ...prev,
        isSpeaking: false,
        speakingMessageId: null,
      }));
    };

    utterance.onerror = () => {
      setSynthesisState(prev => ({
        ...prev,
        isSpeaking: false,
        speakingMessageId: null,
      }));
    };

    window.speechSynthesis.speak(utterance);
  }, [language, getBcp47Locale]);

  /**
   * Stop Text-to-Speech
   */
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSynthesisState(prev => ({
      ...prev,
      isSpeaking: false,
      speakingMessageId: null,
    }));
  }, []);

  /**
   * Replay active message
   */
  const replaySpeech = useCallback((text: string, messageId: string, overrideLang?: Language) => {
    stopSpeaking();
    setTimeout(() => {
      speakText(text, messageId, overrideLang);
    }, 150);
  }, [stopSpeaking, speakText]);

  return {
    recognitionState,
    synthesisState,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    replaySpeech,
  };
}
