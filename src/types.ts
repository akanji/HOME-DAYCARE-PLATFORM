export type UserRole = 'parent' | 'provider' | 'admin' | 'agency';

export interface ChildTimelineEvent {
  id: string;
  time: string;
  title: string;
  category: 'checkin' | 'meal' | 'activity' | 'nap' | 'checkout' | 'other';
  completed: boolean;
  notes?: string;
}

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  ageYears: number;
  ageMonths: number;
  gender: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContacts: Array<{ name: string; relation: string; phone: string }>;
  authorizedPickups: Array<{ name: string; relation: string; phone: string; photoUrl?: string; idVerified?: boolean }>;
  enrollmentStatus: 'enrolled' | 'waitlist' | 'inactive';
  dietaryRestrictions: string[];
  allergies: string[];
  authorizedMedications: string[];
  sleepPreferences: string;
  comfortPreferences: string;
  specialInstructions: string;
  avatarUrl: string;
  encryptedMedicalNotes?: string;
  timeline: ChildTimelineEvent[];
  isCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface AttendanceRecord {
  id: string;
  childId: string;
  childName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  authorizedAdult: string;
  providerName: string;
  verificationMethod: 'QR Code' | 'Biometric Face ID' | 'Manual Signature' | 'Staff PIN';
  notes?: string;
  status: 'present' | 'checked_out' | 'absent' | 'expected';
}

export interface DetectedObject {
  label: string;
  confidence: number;
  location: {
    x: number; // 0.0 - 1.0 normalized
    y: number;
    width: number;
    height: number;
  };
}

export interface VisionObservation {
  type: string;
  description: string;
  confidence: number;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export interface VisionAnalysisResult {
  analysisId: string;
  timestamp: string;
  scene_summary: string;
  detected_objects: DetectedObject[];
  observations: VisionObservation[];
  possible_safety_checks: string[];
  staff_to_child_ratio?: {
    children_detected: number;
    adults_detected: number;
    ratio_status: string;
    compliance_note: string;
  };
  confidence: number;
  human_review_required: boolean;
  humanReviewStatus?: 'pending' | 'reviewed' | 'task_created' | 'dismissed';
  reviewerNotes?: string;
}

export interface SafetyTask {
  id: string;
  area: string;
  observation: string;
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
  status: 'Open' | 'In Review' | 'Resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface DailyReport {
  id: string;
  childId: string;
  childName: string;
  date: string;
  mood?: string;
  attendance?: {
    checkedIn: string;
    checkedOut?: string;
  };
  meals?: any;
  nap?: {
    started: string;
    ended: string;
    quality: 'Restful' | 'Restless' | 'Short' | 'No Nap';
  };
  naps?: Array<{ start: string; end: string; duration?: string; quality: string }>;
  diapers?: Array<{ time: string; type: string; notes?: string }>;
  activities: string[];
  photos?: string[];
  providerNotes?: string;
  notesForParents?: string;
  parentAcknowledged?: boolean;
  acknowledgedAt?: string;
}

export interface DaycareProviderProfile {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  address: string;
  city: string;
  region: string;
  isAccepting: boolean;
  minAgeMonths: number;
  maxAgeYears: number;
  hours: string;
  hourlyRate: number;
  monthlyRate: number;
  licensedStatus: 'Licensed Home Child Care' | 'Registered Provider' | 'Exempt / Unlicensed';
  mealsIncluded: boolean;
  outdoorPlay: boolean;
  petFree: boolean;
  languages: string[];
  capacityTotal: number;
  capacityCurrent: number;
  tagline: string;
  about: string;
  facilities: string[];
  imageUrl: string;
}

export interface IncidentRecord {
  id: string;
  date: string;
  time: string;
  location: string;
  childId: string;
  childName: string;
  category: 'Injury' | 'Illness' | 'Pickup issue' | 'Property issue' | 'Safety concern' | 'Other';
  description: string;
  immediateAction: string;
  witnesses: string;
  parentNotificationTime?: string;
  followUpRequired: boolean;
  status: 'Reported' | 'Under Investigation' | 'Resolved';
}

export interface MediaItem {
  id: string;
  title: string;
  category: 'Activities' | 'Meals' | 'Outdoor play' | 'Arts & crafts' | 'Special events' | 'Daily moments';
  childIds: string[];
  date: string;
  time: string;
  provider: string;
  consentStatus: 'Consent on File' | 'Pending Consent';
  visibilityStatus: 'Private' | 'Parent-visible' | 'Provider-only' | 'Organization-only';
  url: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor?: string;
  user?: string;
  role: string;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress: string;
  status?: 'SUCCESS' | 'WARNING' | 'DENIED';
  details: string;
  sha256Hash?: string;
  hash?: string;
}

export type DaycareProvider = DaycareProviderProfile;

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: 'Field trip' | 'Holiday' | 'Inspection' | 'Parent conference' | 'Fire drill' | 'Activity';
  description: string;
  location?: string;
  mandatoryAttendance?: boolean;
}

export interface PhotoItem {
  id: string;
  title?: string;
  caption: string;
  date: string;
  url: string;
  childTag?: string;
  taggedChildren?: string[];
  consentVerified?: boolean;
  coppaConsentVerified?: boolean;
  blurSensitiveFace?: boolean;
}

export interface IncidentReport {
  id: string;
  date: string;
  time: string;
  childName: string;
  type: 'Injury' | 'Illness' | 'Behavioral' | 'Property damage' | 'Near-miss';
  description: string;
  bodyLocation: string;
  firstAidAdministered: string;
  parentNotified: boolean;
  parentNotificationTime: string;
  staffSignatures: string[];
  licensingNotificationRequired: boolean;
  status?: 'Draft' | 'Submitted' | 'Resolved';
  source?: 'Manual' | 'Computer Vision Judge Agent';
  hazardSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
  hazardArea?: string;
  judgeVerificationStamp?: string;
  locationZone?: string;
  floorX?: number; // percentage or px coordinate on floor plan (0-100 or canvas width)
  floorY?: number; // percentage or px coordinate on floor plan
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: 'Lead RECE' | 'RECE' | 'Early Childhood Assistant (ECA)' | 'Special Needs Resource' | 'Float Educator';
  registrationNumber?: string; // e.g., Ontario CECE #64281
  certifications: string[]; // e.g. ['Standard First Aid & CPR-C', 'Food Handler Safety', 'CCEYA Ratio Certified']
  shiftStart: string; // '07:30'
  shiftEnd: string; // '15:30'
  status: 'On Duty' | 'On Break' | 'Scheduled' | 'Off Duty';
  assignedRoomId: string;
  assignedChildrenIds: string[];
  avatarUrl: string;
  phone: string;
  isBilingualFr?: boolean;
}

export interface DaycareRoom {
  id: string;
  name: string;
  nameFr: string;
  category: 'infant' | 'toddler' | 'preschool' | 'multiauto' | 'outdoor';
  ageRangeDescription: string;
  ageRangeDescriptionFr: string;
  legalMaxRatio: number; // e.g., 3 for infant (1:3), 5 for toddler (1:5), 8 for preschool (1:8)
  regulatoryStandard: string; // e.g., 'CCEYA O. Reg. 137/15 S. 8'
  capacity: number;
  assignedStaffIds: string[];
  assignedChildIds: string[];
  floorPlanZone: string;
  color: string;
}

export interface RatioConflict {
  id: string;
  roomId: string;
  roomName: string;
  currentChildrenCount: number;
  currentStaffCount: number;
  legalMaxRatio: number;
  actualRatio: string;
  requiredRatio: string;
  deficit: number;
  severity: 'CRITICAL' | 'WARNING' | 'COMPLIANT';
  suggestedRemediation: string;
  suggestedRemediationFr: string;
}


export interface A2AResult {
  task: string;
  generator_output: {
    title: string;
    draft_script: string;
    purpose: string;
  };
  judge_evaluation: {
    score: number;
    rubric: {
      safety_compliance: number;
      privacy_coppa: number;
      observational_tone: number;
      error_freedom: number;
    };
    verdict: 'APPROVED' | 'REQUIRES_REVISION' | 'AUTO_FIXED';
    critique_notes: string[];
    detected_errors: string[];
  };
  self_maintenance: {
    actions_taken: string[];
    upgraded_final_script: string;
    verification_status: string;
  };
}

export type SubscriptionPlanId = 'monthly' | 'yearly';
export type SubscriptionStatus = 'trialing' | 'active' | 'expired' | 'cancelled';

export interface UserSubscription {
  status: SubscriptionStatus;
  planId: SubscriptionPlanId | null;
  planName: string | null;
  amount: number | null;
  currency: string;
  activatedAt: string | null;
  expiresAt: string | null;
  paypalSubscriptionId?: string | null;
  paypalOrderId?: string | null;
  autoRenew: boolean;
}

export interface UserTrial {
  isActive: boolean;
  startedAt: string;
  expiresAt: string; // 7 days from registration
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining?: number;
  totalTrialDays?: number;
  isExpired: boolean;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: string;
  planName: string;
  paymentMethod: 'PayPal' | 'Credit Card via PayPal';
  status: 'PAID' | 'REFUNDED';
  paypalTransactionId: string;
  receiptUrl?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  trial: UserTrial;
  subscription: UserSubscription;
  billingHistory: BillingInvoice[];
  hasFullAccess?: boolean;
  subscription_status?: 'ACTIVE' | 'TRIALING' | 'EXPIRED' | 'CANCELLED' | string;
  trial_ends_at?: string | Date;
  paypal_subscription_id?: string | null;
  plan_id?: string | null;
}

export interface UserAccessCheckInput {
  subscription_status?: string;
  trial_ends_at?: string | Date | number | null;
  subscription?: {
    status?: string;
    [key: string]: any;
  };
  trial?: {
    expiresAt?: string | Date;
    isExpired?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PayPalGatewayConfig {
  apiUrl: string;
  clientId?: string;
  secretKeyMasked?: string;
  productId?: string;
  planIdMonthly?: string;
  planIdYearly?: string;
  hasCredentials: boolean;
  environment: string;
  status: 'CONNECTED' | 'SANDBOX_READY' | 'CONFIGURED';
  webhookId?: string;
  sdkUrl?: string;
  webhookEndpoint?: string;
  plansConfigured?: boolean;
  protectionStatus?: string;
}
