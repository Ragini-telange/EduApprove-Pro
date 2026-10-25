/**
 * Type Definitions for AICTE SmartAssist Multilingual Chatbot & Voice Assistant (Phase 6)
 */

import type { UserRole } from './authority';
import type { Language } from '../context/LanguageContext';

export type ChatRole = UserRole;

export type SourceType = 'handbook_clause' | 'verified_database_record' | 'statutory_calendar' | 'audit_log';

export interface SourceReference {
  id: string;
  type: SourceType;
  title: string;
  reference: string; // e.g. "APH Clause 2.14(a)", "AICTE/2026-27/1-9382105118"
  snippet: string;
  url?: string;
  category?: string;
}

export interface LinkedCaseInfo {
  applicationId: string;
  applicationNumber: string;
  institutionName: string;
  instituteCode: string;
  region: string;
  state: string;
  stage: string;
  status: string;
  deadlineDate: string;
  isOverdue: boolean;
  evcStatus: string;
  complianceStatus: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  language: Language;
  timestamp: string;
  sources?: SourceReference[];
  linkedCases?: LinkedCaseInfo[];
  isInsufficientEvidence?: boolean;
  isPermissionRestricted?: boolean;
  status?: 'sending' | 'thinking' | 'complete' | 'error';
}

export interface SuggestedPrompt {
  id: string;
  text: string;
  role: UserRole;
  language: Language;
  category: 'overdue' | 'evc' | 'compliance' | 'delays' | 'own_status' | 'handbook';
}

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  interimTranscript: string;
}

export interface SpeechSynthesisState {
  isSpeaking: boolean;
  speakingMessageId: string | null;
  isSupported: boolean;
  activeLanguage: Language;
}

export interface ChatbotQueryOptions {
  userRole: UserRole;
  userName: string;
  userRegion?: string;
  institutionId?: string;
  language: Language;
  targetAppId?: string;
}

export interface ChatbotResponsePayload {
  messageText: string;
  language: Language;
  sources: SourceReference[];
  linkedCases: LinkedCaseInfo[];
  isInsufficientEvidence: boolean;
  isPermissionRestricted: boolean;
}
