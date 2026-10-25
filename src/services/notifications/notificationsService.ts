import { supabase, isSupabaseConfigured } from '../supabase/client';
import { CanonicalNotification, CanonicalApplication, CanonicalDocument, CanonicalComplianceRequirement } from '../../types/canonical';
import { mapSupabaseToCanonicalNotification } from '../data/mappers';
import {
  FALLBACK_NOTIFICATIONS,
  FALLBACK_APPLICATIONS,
  FALLBACK_DOCUMENTS,
  FALLBACK_COMPLIANCE,
} from '../data/fallbackStore';

let inMemoryNotifications: CanonicalNotification[] = [...FALLBACK_NOTIFICATIONS];

export interface CreateNotificationPayload {
  recipientRole: string;
  recipientId?: string;
  title: string;
  message: string;
  category: string;
  severity?: 'info' | 'warning' | 'critical';
  applicationId?: string;
  applicationNumber?: string;
  actionUrl?: string;
}

export interface SmartAlertsReport {
  totalEvaluated: number;
  newAlertsCreated: number;
  activeAlerts: CanonicalNotification[];
}

export const notifications = {
  /**
   * notifications.getForUser()
   * Retrieves role-specific and user-targeted notifications
   */
  async getForUser(userId?: string, role?: string): Promise<CanonicalNotification[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('app_notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.or(`recipient_id.eq.${userId},recipient_role.eq.${role || 'institution'}`);
        } else if (role) {
          query = query.eq('recipient_role', role);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(mapSupabaseToCanonicalNotification);
        }
      } catch (err) {
        console.warn('Supabase notifications query failed, using fallback:', err);
      }
    }

    if (role) {
      return inMemoryNotifications.filter(
        (n) => n.recipientRole === role || (!n.recipientId && n.recipientRole === 'all')
      );
    }
    return inMemoryNotifications;
  },

  /**
   * notifications.markAsRead()
   * Marks a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('app_notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      } catch (err) {
        console.warn('Supabase markAsRead failed, using memory state:', err);
      }
    }

    inMemoryNotifications = inMemoryNotifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    return true;
  },

  /**
   * notifications.create()
   * Emits a new regulatory notification
   */
  async create(payload: CreateNotificationPayload): Promise<CanonicalNotification> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_notifications')
          .insert({
            recipient_role: payload.recipientRole,
            recipient_id: payload.recipientId || null,
            title: payload.title,
            message: payload.message,
            category: payload.category || 'General',
            severity: payload.severity || 'info',
            application_id: payload.applicationId || null,
            application_number: payload.applicationNumber || null,
            is_read: false,
            action_url: payload.actionUrl || null,
          })
          .select('*')
          .single();

        if (!error && data) {
          const mapped = mapSupabaseToCanonicalNotification(data);
          inMemoryNotifications.unshift(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase create notification failed, using memory state:', err);
      }
    }

    const newNotif: CanonicalNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientRole: payload.recipientRole,
      recipientId: payload.recipientId,
      title: payload.title,
      message: payload.message,
      category: payload.category,
      severity: payload.severity || 'info',
      applicationId: payload.applicationId,
      applicationNumber: payload.applicationNumber,
      isRead: false,
      createdAt: now,
      actionUrl: payload.actionUrl,
    };

    inMemoryNotifications.unshift(newNotif);
    return newNotif;
  },

  /**
   * notifications.emitDeadlineAlert()
   * Emits upcoming deadline or overdue condition alert notification
   */
  async emitDeadlineAlert(
    app: { id: string; applicationNumber: string; institutionName?: string; deadlineDate?: string },
    condition: 'upcoming_deadline' | 'overdue'
  ): Promise<CanonicalNotification> {
    if (condition === 'overdue') {
      return this.create({
        recipientRole: 'senior_authority',
        title: `CRITICAL SLA OVERDUE: ${app.applicationNumber}`,
        message: `Application ${app.applicationNumber} (${app.institutionName || 'Institution'}) has breached statutory scrutiny SLA (Deadline: ${app.deadlineDate || 'Expired'}). Bureau escalation triggered.`,
        category: 'Overdue Condition',
        severity: 'critical',
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
      });
    } else {
      return this.create({
        recipientRole: 'institution',
        title: `Upcoming Statutory Deadline: ${app.applicationNumber}`,
        message: `Statutory rectification window for Application ${app.applicationNumber} closes on ${app.deadlineDate || 'Soon'}. Please submit required documents before cutoff.`,
        category: 'Upcoming Deadline',
        severity: 'warning',
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
      });
    }
  },

  /**
   * notifications.processSmartAlerts()
   * Autonomous engine generating statutory alerts across all 7 lifecycle conditions:
   * 1. Approaching deadline
   * 2. Overdue application
   * 3. Upcoming compliance deadline
   * 4. Document expiry
   * 5. Expired document
   * 6. EVC-related deadline
   * 7. Pending correction
   */
  async processSmartAlerts(customData?: {
    applications?: CanonicalApplication[];
    documents?: CanonicalDocument[];
    compliance?: CanonicalComplianceRequirement[];
  }): Promise<SmartAlertsReport> {
    const apps = customData?.applications || FALLBACK_APPLICATIONS;
    const docs = customData?.documents || FALLBACK_DOCUMENTS;
    const comps = customData?.compliance || FALLBACK_COMPLIANCE;

    let newAlertsCreated = 0;
    const existingNotifications = [...inMemoryNotifications];

    // Helper: checks if a notification with matching category and target already exists
    const isDuplicate = (category: string, identifier: string): boolean => {
      return existingNotifications.some(
        (n) => n.category === category && (n.applicationNumber === identifier || n.title.includes(identifier))
      );
    };

    const now = Date.now();

    // 1 & 2: Evaluate Applications for Deadlines, Overdue, EVC & Corrections
    for (const app of apps) {
      const isCompleted = app.status === 'completed' || app.status === 'rejected';

      if (!isCompleted && app.deadlineDate) {
        const diffDays = Math.ceil((new Date(app.deadlineDate).getTime() - now) / (1000 * 3600 * 24));

        // 1. Approaching Deadline (within 7 days)
        if (diffDays >= 0 && diffDays <= 7) {
          if (!isDuplicate('Approaching Deadline', app.applicationNumber)) {
            await this.create({
              recipientRole: 'institution',
              title: `Approaching Deadline: ${app.applicationNumber}`,
              message: `Application ${app.applicationNumber} statutory rectification/scrutiny window closes in ${diffDays} day(s) on ${app.deadlineDate}.`,
              category: 'Approaching Deadline',
              severity: 'warning',
              applicationId: app.id,
              applicationNumber: app.applicationNumber,
              actionUrl: `/institution/applications`,
            });
            newAlertsCreated++;
          }
        }

        // 2. Overdue Application (deadline has passed)
        if (diffDays < 0) {
          if (!isDuplicate('Overdue Application', app.applicationNumber)) {
            await this.create({
              recipientRole: 'senior_authority',
              title: `CRITICAL SLA OVERDUE: ${app.applicationNumber}`,
              message: `Application ${app.applicationNumber} has breached statutory scrutiny deadline by ${Math.abs(diffDays)} day(s) (Cutoff was: ${app.deadlineDate}). Senior Bureau escalation triggered.`,
              category: 'Overdue Application',
              severity: 'critical',
              applicationId: app.id,
              applicationNumber: app.applicationNumber,
              actionUrl: `/senior/dashboard?tab=action_centre`,
            });
            newAlertsCreated++;
          }
        }
      }

      // 6. EVC-related Deadline
      if (app.status === 'evc_scheduled' || app.status === 'pending_evc') {
        if (!isDuplicate('EVC-related Deadline', app.applicationNumber)) {
          await this.create({
            recipientRole: 'regional_officer',
            title: `EVC Inspection & Reporting Deadline: ${app.applicationNumber}`,
            message: `Expert Visiting Committee (EVC) panel inspection for ${app.applicationNumber} requires scheduling and report submission within statutory 3-day SLA.`,
            category: 'EVC-related Deadline',
            severity: 'warning',
            applicationId: app.id,
            applicationNumber: app.applicationNumber,
            actionUrl: `/regional/evc`,
          });
          newAlertsCreated++;
        }
      }

      // 7. Pending Correction
      if (app.status === 'correction_required') {
        if (!isDuplicate('Pending Correction', app.applicationNumber)) {
          await this.create({
            recipientRole: 'institution',
            title: `Pending Correction Required: ${app.applicationNumber}`,
            message: `Deficiency memo served by Regional Scrutiny Officer for ${app.applicationNumber}. Please upload rectified documents in accordance with APH guidelines.`,
            category: 'Pending Correction',
            severity: 'warning',
            applicationId: app.id,
            applicationNumber: app.applicationNumber,
            actionUrl: `/institution/applications`,
          });
          newAlertsCreated++;
        }
      }
    }

    // 3: Evaluate Compliance Requirements
    for (const comp of comps) {
      const isPending = comp.status !== 'verified';
      if (isPending && comp.dueDate) {
        const diffDays = Math.ceil((new Date(comp.dueDate).getTime() - now) / (1000 * 3600 * 24));
        if (diffDays <= 7) {
          if (!isDuplicate('Upcoming Compliance Deadline', comp.title)) {
            await this.create({
              recipientRole: 'institution',
              title: `Upcoming Compliance Deadline: ${comp.title}`,
              message: `Mandatory statutory compliance item "${comp.title}" is due on ${comp.dueDate} (${diffDays < 0 ? `Overdue by ${Math.abs(diffDays)} day(s)` : `${diffDays} day(s) left`}).`,
              category: 'Upcoming Compliance Deadline',
              severity: diffDays < 0 ? 'critical' : 'warning',
              actionUrl: `/institution/compliance`,
            });
            newAlertsCreated++;
          }
        }
      }
    }

    // 4 & 5: Evaluate Documents for Expiry
    for (const doc of docs) {
      if (doc.expiryDate) {
        const diffDays = Math.ceil((new Date(doc.expiryDate).getTime() - now) / (1000 * 3600 * 24));

        // 4. Document Expiry (approaching within 30 days)
        if (diffDays > 0 && diffDays <= 30) {
          if (!isDuplicate('Document Expiry', doc.name)) {
            await this.create({
              recipientRole: 'institution',
              title: `Document Expiry Approaching: ${doc.name}`,
              message: `Statutory certificate "${doc.name}" will expire on ${doc.expiryDate} (${diffDays} days remaining). Please renew in Smart Document Passport.`,
              category: 'Document Expiry',
              severity: 'warning',
              applicationId: doc.applicationId,
              actionUrl: `/institution/passport`,
            });
            newAlertsCreated++;
          }
        }

        // 5. Expired Document
        if (diffDays <= 0) {
          if (!isDuplicate('Expired Document', doc.name)) {
            await this.create({
              recipientRole: 'institution',
              title: `Statutory Document Expired: ${doc.name}`,
              message: `Certificate "${doc.name}" expired on ${doc.expiryDate}. Statutory scrutiny cannot proceed without valid renewed certificate.`,
              category: 'Expired Document',
              severity: 'critical',
              applicationId: doc.applicationId,
              actionUrl: `/institution/passport`,
            });
            newAlertsCreated++;
          }
        }
      }
    }

    return {
      totalEvaluated: apps.length + docs.length + comps.length,
      newAlertsCreated,
      activeAlerts: inMemoryNotifications,
    };
  },
};
