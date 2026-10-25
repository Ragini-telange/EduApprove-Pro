import { EVCStatusData } from '../types';
import { mockEVCDetail } from '../data/mockEVC';
import { api } from '../api/client';

export interface EVCChecklistItem {
  id: number;
  label: string;
  category: 'Faculty' | 'Infrastructure' | 'Governance' | 'Safety' | 'Academics';
  done: boolean;
}

let activeChecklist: EVCChecklistItem[] = [
  {
    id: 1,
    label: 'Physical verification dossiers for all faculty degrees & Form 16',
    category: 'Faculty',
    done: true,
  },
  {
    id: 2,
    label: 'Laboratories equipment functional calibration logs signed by HoDs',
    category: 'Infrastructure',
    done: true,
  },
  {
    id: 3,
    label: 'Central Library digital NDLI access terminals configured',
    category: 'Academics',
    done: true,
  },
  {
    id: 4,
    label: 'Barrier-free ramp & lift accessibility signage ready',
    category: 'Infrastructure',
    done: true,
  },
  {
    id: 5,
    label: 'Administrative Committee room display screen and Wi-Fi ready',
    category: 'Governance',
    done: true,
  },
  {
    id: 6,
    label: 'Fire Safety NOC original physical certificate kept on desk',
    category: 'Safety',
    done: false,
  },
  {
    id: 7,
    label: 'Anti-Ragging squad duty roster & CCTV recording backup',
    category: 'Safety',
    done: true,
  },
  {
    id: 8,
    label: 'Affiliating university endorsement for expanded intake',
    category: 'Governance',
    done: false,
  },
];

export const evcService = {
  /**
   * Retrieves EVC status and details for an institution
   */
  async getEVCStatus(institutionId?: string): Promise<EVCStatusData> {
    try {
      const live = await api.getEVCStatus();
      if (live && live.application_number) {
        return {
          ...mockEVCDetail,
          ...live,
        };
      }
    } catch {
      // fallback
    }

    // Return mock detailed data
    const completedCount = activeChecklist.filter((i) => i.done).length;
    const readinessPct = Math.round((completedCount / activeChecklist.length) * 100);

    return {
      ...mockEVCDetail,
      preparation_status_pct: readinessPct,
    };
  },

  /**
   * Retrieves the checklist items
   */
  async getChecklist(): Promise<EVCChecklistItem[]> {
    return [...activeChecklist];
  },

  /**
   * Toggles a checklist milestone state
   */
  async toggleChecklistItem(id: number): Promise<EVCChecklistItem[]> {
    activeChecklist = activeChecklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    return [...activeChecklist];
  },

  /**
   * Retrieves required document dossier list
   */
  async getRequiredDocuments(): Promise<string[]> {
    return mockEVCDetail.required_documents || [];
  },

  /**
   * Retrieves committee visit instructions
   */
  async getInstructions(): Promise<string[]> {
    return mockEVCDetail.instructions || [];
  },
};
