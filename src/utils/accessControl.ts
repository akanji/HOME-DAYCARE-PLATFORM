import { UserAccessCheckInput } from '../types';

/**
 * Access Decision Result Interface
 */
export interface AccessDecision {
  hasAccess: boolean;
  reason: 'ACTIVE_SUBSCRIPTION' | 'ACTIVE_TRIAL' | 'TRIAL_EXPIRED' | 'SUBSCRIPTION_INACTIVE' | 'NO_USER';
  status: string;
  trialEndsAt?: Date | null;
  message: string;
}

/**
 * Evaluates whether a user has active platform access based on subscription and trial status.
 *
 * Requirements:
 * - Grant access if user.subscription_status === 'ACTIVE'
 * - Grant access if user.subscription_status === 'TRIALING' && user.trial_ends_at > now
 * - Block access and redirect to Payment Gateway otherwise
 *
 * @param user User object or session representation
 * @returns boolean - true if access granted, false if blocked
 */
export function checkAccess(user: UserAccessCheckInput | null | undefined): boolean {
  if (!user) return false;

  const now = new Date();

  // Extract and normalize status (supports top-level subscription_status and nested subscription.status)
  const rawStatus = (
    user.subscription_status ||
    user.subscription?.status ||
    ''
  ).toString().trim().toUpperCase();

  // 1. Grant access if subscription status is active
  if (rawStatus === 'ACTIVE') {
    return true;
  }

  // 2. Grant access if trial is still active
  if (rawStatus === 'TRIALING') {
    // Check if explicitly simulated as expired
    if (user.trial?.isExpired) {
      return false;
    }

    const rawTrialEnd = user.trial_ends_at || user.trial?.expiresAt;
    if (rawTrialEnd) {
      const trialEndDate = rawTrialEnd instanceof Date ? rawTrialEnd : new Date(rawTrialEnd);
      if (!isNaN(trialEndDate.getTime()) && trialEndDate > now) {
        return true;
      }
    }
  }

  // Block access and redirect to Payment Gateway
  return false;
}

/**
 * Detailed telemetry inspection for audit trails and UI indicators.
 */
export function getAccessDecision(user: UserAccessCheckInput | null | undefined): AccessDecision {
  if (!user) {
    return {
      hasAccess: false,
      reason: 'NO_USER',
      status: 'UNAUTHENTICATED',
      message: 'No active authenticated user session found.',
    };
  }

  const now = new Date();
  const rawStatus = (
    user.subscription_status ||
    user.subscription?.status ||
    ''
  ).toString().trim().toUpperCase();

  if (rawStatus === 'ACTIVE') {
    return {
      hasAccess: true,
      reason: 'ACTIVE_SUBSCRIPTION',
      status: 'ACTIVE',
      message: 'Full access granted via active paid subscription.',
    };
  }

  const rawTrialEnd = user.trial_ends_at || user.trial?.expiresAt;
  const trialEndDate = rawTrialEnd
    ? (rawTrialEnd instanceof Date ? rawTrialEnd : new Date(rawTrialEnd))
    : null;

  if (rawStatus === 'TRIALING') {
    if (user.trial?.isExpired) {
      return {
        hasAccess: false,
        reason: 'TRIAL_EXPIRED',
        status: 'EXPIRED',
        trialEndsAt: trialEndDate,
        message: '7-day trial has been simulated or marked as expired. Access restricted.',
      };
    }

    if (trialEndDate && !isNaN(trialEndDate.getTime()) && trialEndDate > now) {
      return {
        hasAccess: true,
        reason: 'ACTIVE_TRIAL',
        status: 'TRIALING',
        trialEndsAt: trialEndDate,
        message: 'Access granted under active 7-day free trial.',
      };
    }

    return {
      hasAccess: false,
      reason: 'TRIAL_EXPIRED',
      status: 'EXPIRED',
      trialEndsAt: trialEndDate,
      message: '7-day trial period has concluded. Redirecting to payment gateway.',
    };
  }

  return {
    hasAccess: false,
    reason: 'SUBSCRIPTION_INACTIVE',
    status: rawStatus || 'INACTIVE',
    trialEndsAt: trialEndDate,
    message: 'Subscription is inactive or expired. Redirecting to payment gateway.',
  };
}
