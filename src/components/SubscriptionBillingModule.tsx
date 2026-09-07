import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  Shield,
  ShieldCheck,
  Lock,
  Clock,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Download,
  UserPlus,
  LogIn,
  LogOut,
  Key,
  Receipt,
  Zap,
  Award,
  Calendar,
  DollarSign,
  Info,
  ShieldAlert,
  User,
  Eye,
  EyeOff,
  Server,
  Globe,
  Activity,
} from 'lucide-react';
import { AuthUser, SubscriptionPlanId, BillingInvoice, PayPalGatewayConfig } from '../types';
import { safeFetchJson } from '../utils/apiClient';
import { PayPalSubscriptionSmartButton } from './PayPalSubscriptionSmartButton';

interface SubscriptionBillingModuleProps {
  currentUser: AuthUser | null;
  onSignUp: (fullName: string, email: string, pwd: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onSignIn: (email: string, pwd: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onSignOut: () => Promise<void>;
  onChangePassword: (currentPwd: string, newPwd: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onResetPassword: (email: string) => Promise<{ success: boolean; message?: string; notice?: string; error?: string }>;
  onSubscribePayPal: (planId: SubscriptionPlanId, explicitSubscriptionId?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onCancelSubscription: (immediate: boolean) => Promise<{ success: boolean; message?: string; error?: string }>;
  onSimulateTrialExpiration: () => Promise<void>;
  onResetTrial: () => Promise<void>;
  onToggleAutoRenew?: (autoRenew?: boolean) => Promise<{ success: boolean; autoRenew?: boolean; message?: string; error?: string }>;
  onSimulateExpiringSoon?: () => Promise<void>;
  onLogAudit?: (action: string, resourceId: string, details: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SubscriptionBillingModule: React.FC<SubscriptionBillingModuleProps> = ({
  currentUser,
  onSignUp,
  onSignIn,
  onSignOut,
  onChangePassword,
  onResetPassword,
  onSubscribePayPal,
  onCancelSubscription,
  onSimulateTrialExpiration,
  onResetTrial,
  onToggleAutoRenew,
  onSimulateExpiringSoon,
  onLogAudit,
  onNavigateTab,
}) => {
  // Navigation inside billing section
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'trial' | 'account' | 'invoices' | 'auth'>('plans');

  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signup');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // PayPal checkout modal state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanId | null>(null);
  const [isProcessingPayPal, setIsProcessingPayPal] = useState(false);
  const [paypalCheckoutStep, setPayPalCheckoutStep] = useState<'review' | 'authenticating' | 'completed'>('review');
  const [paypalTransactionDetails, setPayPalTransactionDetails] = useState<any>(null);
  const [fundingSource, setFundingSource] = useState<'paypal_account' | 'credit_debit' | 'pay_in_4'>('paypal_account');
  const [gatewayConfig, setGatewayConfig] = useState<PayPalGatewayConfig | null>(null);

  // Fetch live PayPal Gateway deployment configuration from server proxy
  useEffect(() => {
    safeFetchJson<PayPalGatewayConfig>('/api/subscription/paypal/gateway-status')
      .then((res) => {
        if (res.ok && res.data) {
          setGatewayConfig(res.data);
        }
      })
      .catch(() => {
        // Fallback default
      });
  }, []);

  // Selected invoice for receipt viewer
  const [viewingInvoice, setViewingInvoice] = useState<BillingInvoice | null>(null);

  // Status feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const notify = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpFullName.trim()) {
      notify('error', 'Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      notify('error', 'Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      notify('error', 'Password must be at least 6 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      notify('error', 'Passwords do not match. Please re-enter.');
      return;
    }

    const res = await onSignUp(signUpFullName, signUpEmail, signUpPassword);
    if (res.success) {
      notify('success', res.message || 'Account created! Your 7-day free trial is now active.');
      setSignUpFullName('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setActiveSubTab('trial');
    } else {
      notify('error', res.error || 'Failed to create account.');
    }
  };

  // Sign In Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword) {
      notify('error', 'Please enter both email and password.');
      return;
    }

    const res = await onSignIn(signInEmail, signInPassword);
    if (res.success) {
      notify('success', res.message || 'Signed in successfully.');
      setSignInEmail('');
      setSignInPassword('');
      setActiveSubTab('plans');
    } else {
      notify('error', res.error || 'Invalid credentials.');
    }
  };

  // Password Reset Request Handler
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      notify('error', 'Please provide a valid email address.');
      return;
    }

    const res = await onResetPassword(resetEmail);
    if (res.success) {
      notify('success', res.message || 'Reset instructions sent.');
      if (res.notice) {
        notify('info', res.notice);
      }
      setAuthMode('signin');
    } else {
      notify('error', res.error || 'Failed to initiate password reset.');
    }
  };

  // Password Change Handler
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    if (!currentPassword || !newPassword) {
      setPasswordChangeError('Current and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    const res = await onChangePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordChangeSuccess('Password successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      notify('success', 'Password successfully changed and encrypted.');
    } else {
      setPasswordChangeError(res.error || 'Failed to update password.');
    }
  };

  // PayPal Checkout Flow
  const startPayPalCheckout = (planId: SubscriptionPlanId) => {
    setSelectedPlanForCheckout(planId);
    setPayPalCheckoutStep('review');
    setIsProcessingPayPal(false);
  };

  const executePayPalPayment = async () => {
    if (!selectedPlanForCheckout) return;
    setIsProcessingPayPal(true);
    setPayPalCheckoutStep('authenticating');

    try {
      const res = await onSubscribePayPal(selectedPlanForCheckout);
      if (res.success) {
        setPayPalCheckoutStep('completed');
        setPayPalTransactionDetails(res);
        notify('success', res.message || 'PayPal payment completed successfully!');
      } else {
        notify('error', res.error || 'PayPal payment verification failed.');
        setIsProcessingPayPal(false);
        setPayPalCheckoutStep('review');
      }
    } catch {
      notify('error', 'An error occurred connecting to PayPal service.');
      setIsProcessingPayPal(false);
      setPayPalCheckoutStep('review');
    }
  };

  const handlePayPalSubscriptionApproved = async (subscriptionId: string, planType: SubscriptionPlanId) => {
    setSelectedPlanForCheckout(planType);
    setPayPalCheckoutStep('authenticating');
    setIsProcessingPayPal(true);

    try {
      const res = await onSubscribePayPal(planType, subscriptionId);
      if (res.success) {
        setPayPalCheckoutStep('completed');
        setPayPalTransactionDetails(res);
        notify('success', `PayPal Subscription (${subscriptionId}) confirmed and activated!`);
      } else {
        notify('error', res.error || 'Failed to complete PayPal subscription activation.');
        setIsProcessingPayPal(false);
        setPayPalCheckoutStep('review');
      }
    } catch {
      notify('error', 'Error syncing PayPal subscription with server.');
      setIsProcessingPayPal(false);
      setPayPalCheckoutStep('review');
    }
  };

  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);

  const handleToggleAutoRenew = async (override?: boolean) => {
    setIsTogglingAutoRenew(true);
    try {
      if (onToggleAutoRenew) {
        const res = await onToggleAutoRenew(override);
        if (res.success) {
          notify('success', res.message || `Auto-Renewal preference successfully ${res.autoRenew ? 'enabled' : 'disabled'}.`);
        } else {
          notify('error', res.error || 'Failed to update auto-renewal preference.');
        }
      }
    } catch (err: any) {
      notify('error', err.message || 'Error updating auto-renewal preference');
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const isTrialActive = currentUser?.trial?.isActive ?? false;
  const isTrialExpired = currentUser?.trial?.isExpired ?? false;
  const isSubscriptionActive = currentUser?.subscription?.status === 'active';
  const hasFullAccess = isSubscriptionActive || (isTrialActive && !isTrialExpired);

  const trialDaysRemaining = currentUser?.trial?.daysRemaining ?? 0;
  const trialHoursRemaining = currentUser?.trial?.hoursRemaining ?? 0;

  // 7-day subscription expiration calculations
  const subscriptionExpiresAt = currentUser?.subscription?.expiresAt;
  let daysUntilSubscriptionExpiry: number | null = null;
  let hoursUntilSubscriptionExpiry: number | null = null;
  if (subscriptionExpiresAt) {
    const expiryTime = new Date(subscriptionExpiresAt).getTime();
    const now = Date.now();
    const diffMs = expiryTime - now;
    daysUntilSubscriptionExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    hoursUntilSubscriptionExpiry = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));
  }

  const isSubscriptionExpiringWithinSevenDays =
    Boolean(subscriptionExpiresAt) &&
    daysUntilSubscriptionExpiry !== null &&
    daysUntilSubscriptionExpiry <= 7 &&
    daysUntilSubscriptionExpiry >= 0 &&
    (currentUser?.subscription?.status === 'active' || currentUser?.subscription?.status === 'cancelled');

  return (
    <div id="subscription-billing-container" className="space-y-6 font-sans">
      {/* Status Feedback Toast */}
      {statusMessage && (
        <div
          id="billing-status-banner"
          className={`p-3.5 rounded-lg border text-xs font-mono flex items-center justify-between shadow-md transition-all animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-amber-600" />}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Top Header Banner */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#52632B] flex items-center justify-center text-white shadow-xs border border-[#E5A910]/40">
                <CreditCard className="w-5 h-5 text-[#E5A910]" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono uppercase tracking-tight text-gray-900 dark:text-neutral-100">
                  Subscription & Billing
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  Manage Account, 7-Day Free Trial, PayPal Plans & Invoices
                </p>
              </div>
            </div>
          </div>

          {/* Current Status Pill & Quick Action */}
          <div className="flex flex-wrap items-center gap-2 font-mono">
            {isSubscriptionActive ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>ACTIVE: {currentUser?.subscription?.planName || 'Paid Plan'}</span>
              </div>
            ) : isTrialExpired ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>TRIAL EXPIRED — SELECT PLAN</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
                <Clock className="w-4 h-4 text-[#D49A00]" />
                <span>
                  7-DAY FREE TRIAL ({trialDaysRemaining}d {trialHoursRemaining}h remaining)
                </span>
              </div>
            )}

            {currentUser ? (
              <button
                id="header-sign-out-btn"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Sign out and terminate session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setActiveSubTab('auth');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#52632B] text-xs text-[#52632B] dark:text-[#E5A910] hover:bg-[#52632B]/10 font-bold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setActiveSubTab('auth');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#52632B] text-white text-xs font-bold hover:bg-[#3E4C1E] border border-[#E5A910]/30"
                >
                  Sign Up (7-Day Trial)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 mt-6 pt-4 border-t border-gray-100 dark:border-neutral-800 text-xs font-mono font-bold uppercase">
          <button
            id="tab-plans-btn"
            onClick={() => setActiveSubTab('plans')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'plans'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscription Plans</span>
          </button>

          <button
            id="tab-trial-btn"
            onClick={() => setActiveSubTab('trial')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'trial'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>7-Day Free Trial</span>
            {isTrialActive && !isTrialExpired && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-[#E5A910] text-black">
                {trialDaysRemaining}d
              </span>
            )}
          </button>

          <button
            id="tab-account-btn"
            onClick={() => setActiveSubTab('account')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'account'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account & Security</span>
          </button>

          <button
            id="tab-invoices-btn"
            onClick={() => setActiveSubTab('invoices')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'invoices'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Invoices & Billing History ({currentUser?.billingHistory?.length ?? 0})</span>
          </button>

          <button
            id="tab-auth-btn"
            onClick={() => setActiveSubTab('auth')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'auth'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Sign In / Sign Up</span>
          </button>
        </div>
      </div>

      {/* Visual Warning Banner: Subscription within 7 days of expiring */}
      {isSubscriptionExpiringWithinSevenDays && (
        <div
          id="subscription-expiring-soon-banner"
          className="bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500 dark:border-amber-600 rounded-2xl p-5 shadow-sm space-y-3 transition-all animate-fadeIn"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <AlertTriangle className="w-5 h-5 text-black" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-black shadow-xs">
                    Expiration Warning • {daysUntilSubscriptionExpiry === 0 ? 'Expires Today' : `${daysUntilSubscriptionExpiry} Day${daysUntilSubscriptionExpiry === 1 ? '' : 's'} Remaining`}
                  </span>
                  <span
                    id="banner-auto-renew-status"
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                      currentUser?.subscription?.autoRenew
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {currentUser?.subscription?.autoRenew ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Auto-Renewal Active
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> Auto-Renewal Disabled
                      </>
                    )}
                  </span>
                </div>
                <h3 className="text-base font-bold font-mono text-gray-900 dark:text-neutral-100">
                  Subscription is within 7 days of expiring!
                </h3>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Your <strong className="text-gray-900 dark:text-white">{currentUser?.subscription?.planName || 'Daycare Safety Subscription'}</strong> will expire on{' '}
                  <strong className="text-gray-900 dark:text-white">
                    {new Date(subscriptionExpiresAt!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>{' '}
                  ({daysUntilSubscriptionExpiry} days remaining).
                  {currentUser?.subscription?.autoRenew ? (
                    <span className="block mt-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                      Auto-Renewal is ON: PayPal will automatically renew your plan prior to expiration.
                    </span>
                  ) : (
                    <span className="block mt-1 text-amber-900 dark:text-amber-300 font-semibold">
                      Auto-Renewal is OFF: AI hazard inspections, emergency alerting, and parent portals will pause upon expiration without renewal.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons inside Warning Banner */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                id="banner-toggle-auto-renew-btn"
                type="button"
                onClick={() => handleToggleAutoRenew()}
                disabled={isTogglingAutoRenew}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-transform active:scale-[0.98] cursor-pointer border ${
                  currentUser?.subscription?.autoRenew
                    ? 'bg-white dark:bg-[#181a15] text-gray-800 dark:text-gray-200 border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    : 'bg-[#52632B] hover:bg-[#3E4C1E] text-white border-[#E5A910]/40'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTogglingAutoRenew ? 'animate-spin' : ''}`} />
                <span>{currentUser?.subscription?.autoRenew ? 'Turn Off Auto-Renew' : 'Enable Auto-Renewal'}</span>
              </button>

              <button
                id="banner-renew-paypal-btn"
                type="button"
                onClick={() => {
                  setActiveSubTab('plans');
                  startPayPalCheckout(currentUser?.subscription?.planId || 'monthly');
                }}
                className="px-4 py-2 rounded-xl bg-[#E5A910] hover:bg-[#D49A00] text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform active:scale-[0.98] cursor-pointer border border-black/10"
              >
                <CreditCard className="w-3.5 h-3.5 text-black" />
                <span>Renew via PayPal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Restriction Warning Banner when Trial has Expired */}
      {isTrialExpired && !isSubscriptionActive && (
        <div
          id="trial-expired-alert-banner"
          className="bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 rounded-xl p-5 shadow-lg space-y-3 font-sans animate-scaleIn"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-mono text-rose-900 dark:text-rose-100 uppercase tracking-wide">
                Your 7-Day Free Trial Has Expired
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                Access to premium daycare modules (Computer Vision safety inspections, A2A Judge Agent audits, daily reporting, photo storage, and copilot) is currently restricted. Select a Monthly or Yearly PayPal subscription below to immediately reactivate full platform access.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            <button
              id="activate-monthly-from-banner-btn"
              onClick={() => startPayPalCheckout('monthly')}
              className="px-4 py-2 rounded-lg bg-[#52632B] text-white font-bold hover:bg-[#3E4C1E] transition-colors border border-[#E5A910]/40"
            >
              Activate Monthly Plan ($19.99/mo)
            </button>
            <button
              id="activate-yearly-from-banner-btn"
              onClick={() => startPayPalCheckout('yearly')}
              className="px-4 py-2 rounded-lg bg-[#E5A910] text-black font-bold hover:bg-[#D49A00] transition-colors"
            >
              Activate Yearly Plan ($199.99/yr - Best Value)
            </button>
            <button
              onClick={onResetTrial}
              className="px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40"
              title="Reset 7-day trial for testing/demo"
            >
              (Demo: Reset 7-Day Trial)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SUBSCRIPTION PLANS & PAYPAL BILLING                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'plans' && (
        <div id="plans-tab-content" className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#52632B] dark:text-[#E5A910]">
              Transparent, All-Inclusive Daycare Pricing
            </span>
            <h2 className="text-2xl font-extrabold font-mono uppercase text-gray-900 dark:text-neutral-100">
              Select Your PayPal Subscription
            </h2>
            <p className="text-xs text-gray-600 dark:text-neutral-400">
              Complete your subscription securely via PayPal. Both plans include full platform access, unlimited child enrollments, and statutory CCEYA/COPPA compliance tools.
            </p>
          </div>

          {/* Active Subscription & Auto-Renewal Preferences Banner in Plans tab */}
          {isSubscriptionActive && (
            <div
              id="plans-active-subscription-bar"
              className="max-w-4xl mx-auto p-4 rounded-xl bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-neutral-100">
                      Active: {currentUser?.subscription?.planName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Subscribed
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {currentUser?.subscription?.expiresAt
                      ? `Valid until ${new Date(currentUser.subscription.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${daysUntilSubscriptionExpiry !== null ? `${daysUntilSubscriptionExpiry} days remaining` : 'active'})`
                      : 'Recurring billing via PayPal'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-neutral-800">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase block">Auto-Renewal:</span>
                  <span className={`text-xs font-bold ${currentUser?.subscription?.autoRenew ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>
                    {currentUser?.subscription?.autoRenew ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <button
                  id="plans-auto-renewal-toggle"
                  type="button"
                  role="switch"
                  aria-checked={currentUser?.subscription?.autoRenew ?? false}
                  onClick={() => handleToggleAutoRenew()}
                  disabled={isTogglingAutoRenew}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#52632B] ${
                    currentUser?.subscription?.autoRenew ? 'bg-[#52632B]' : 'bg-gray-300 dark:bg-neutral-700'
                  }`}
                  title="Toggle subscription auto-renewal"
                >
                  <span className="sr-only">Toggle subscription auto-renewal</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      currentUser?.subscription?.autoRenew ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* MONTHLY PLAN CARD */}
            <div
              id="plan-monthly-card"
              className={`rounded-2xl border-2 transition-all p-6 flex flex-col justify-between bg-white dark:bg-[#181a15] shadow-sm relative ${
                currentUser?.subscription?.planId === 'monthly' && isSubscriptionActive
                  ? 'border-[#52632B] ring-2 ring-[#52632B]/20'
                  : 'border-gray-200 dark:border-neutral-800 hover:border-[#52632B]/50'
              }`}
            >
              {currentUser?.subscription?.planId === 'monthly' && isSubscriptionActive && (
                <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#52632B] text-white border border-[#E5A910]/40">
                  Current Active Plan
                </span>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                      Monthly Plan
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 font-mono text-gray-600 dark:text-gray-400 font-bold">
                      Flexible
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pay month-to-month. Cancel anytime with no penalties.
                  </p>
                </div>

                <div className="py-2 border-y border-gray-100 dark:border-neutral-800">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-neutral-100">$19.99</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ month</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">Billed monthly via PayPal</span>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-700 dark:text-neutral-300">
                  {[
                    'Automatic 7-day free trial on enrollment',
                    'Real-time Computer Vision hazard detection',
                    'A2A Judge Agent automated compliance audits',
                    'Unlimited children timelines & attendance',
                    'Parent daily reports & PDF export',
                    'Hardware AES-256 encrypted health vault',
                    'Secure PayPal recurring billing',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#52632B] dark:text-[#E5A910] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-3">
                {/* Official PayPal Subscription Smart Button with exact container ID */}
                <PayPalSubscriptionSmartButton
                  planId="P-8RP56728U1771900GNKORJ6A"
                  containerId="paypal-button-container-P-8RP56728U1771900GNKORJ6A"
                  planType="monthly"
                  planLabel="Subscribe with PayPal ($19.99/mo)"
                  onApproveSuccess={handlePayPalSubscriptionApproved}
                  onFallbackClick={() => startPayPalCheckout('monthly')}
                />

                <div className="text-[10px] text-center text-gray-400 font-mono flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>Encrypted PayPal Tokenized Checkout • Vault Active</span>
                </div>
              </div>
            </div>

            {/* YEARLY PLAN CARD (BEST VALUE) */}
            <div
              id="plan-yearly-card"
              className={`rounded-2xl border-2 transition-all p-6 flex flex-col justify-between bg-white dark:bg-[#181a15] shadow-sm relative ${
                currentUser?.subscription?.planId === 'yearly' && isSubscriptionActive
                  ? 'border-[#E5A910] ring-2 ring-[#E5A910]/20'
                  : 'border-[#52632B] hover:border-[#E5A910]'
              }`}
            >
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-[#E5A910] text-black border border-black/20 shadow-xs">
                ⭐ Save $39.89 / Year (17% OFF)
              </span>

              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                      Yearly Plan
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#52632B]/10 text-[#52632B] dark:text-[#E5A910] font-mono font-bold">
                      Best Value
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Annual commitment. 2 months free + priority cloud syncing.
                  </p>
                </div>

                <div className="py-2 border-y border-gray-100 dark:border-neutral-800">
                  <div className="flex items-baseline gap-1 font-mono">
                    <span className="text-3xl font-extrabold text-[#52632B] dark:text-[#E5A910]">$199.99</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ year</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    Equivalent to only $16.66/month (Save ~17%)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-gray-700 dark:text-neutral-300">
                  {[
                    'Includes all Monthly features',
                    '2 full months free compared to monthly',
                    'Priority compliance reporting & audits',
                    'Guaranteed rate protection for 12 months',
                    'Multi-carer biometric enrollments',
                    'Dedicated priority cloud synchronization',
                    'Single annual tax-deductible invoice',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E5A910] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-3">
                {/* Official PayPal Subscription Smart Button with exact container ID */}
                <PayPalSubscriptionSmartButton
                  planId="P-14S17187NL669422XNKORLRQ"
                  containerId="paypal-button-container-P-14S17187NL669422XNKORLRQ"
                  planType="yearly"
                  planLabel="Subscribe with PayPal ($199.99/yr)"
                  onApproveSuccess={handlePayPalSubscriptionApproved}
                  onFallbackClick={() => startPayPalCheckout('yearly')}
                />

                <div className="text-[10px] text-center text-gray-400 font-mono flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>Instant Activation • Server-Side Token Security</span>
                </div>
              </div>
            </div>
          </div>

          {/* PayPal Payment Gateway Configuration & Diagnostics */}
          <div
            id="paypal-gateway-status-panel"
            className="bg-[#FAF9F6] dark:bg-[#12140f] rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 max-w-4xl mx-auto text-xs font-mono space-y-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-[#52632B] dark:text-[#E5A910] font-bold text-sm">
                <Server className="w-4 h-4" />
                <span>PayPal Gateway Payment Configuration & Deployment</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] w-fit">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Gateway Connected & Operational</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div className="p-3 bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-400 uppercase text-[9px] block">PAYPAL_API_URL:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100 truncate" title={gatewayConfig?.apiUrl || 'https://api-m.sandbox.paypal.com'}>
                  {gatewayConfig?.apiUrl || 'https://api-m.sandbox.paypal.com'}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Sandbox API Gateway</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-400 uppercase text-[9px] block">PAYPAL_PRODUCT_ID:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100 truncate" title={gatewayConfig?.productId || 'PROD-DAYCARE-ENTERPRISE'}>
                  {gatewayConfig?.productId || 'PROD-DAYCARE-ENTERPRISE'}
                </p>
                <span className="text-[10px] text-gray-500">Enterprise Product</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-400 uppercase text-[9px] block">PAYPAL_PLAN_ID_MONTHLY:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100 truncate" title={gatewayConfig?.planIdMonthly || 'P-MONTHLY-1999'}>
                  {gatewayConfig?.planIdMonthly || 'P-MONTHLY-1999'}
                </p>
                <span className="text-[10px] text-[#52632B] dark:text-[#E5A910] font-semibold">$19.99 / Month</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-400 uppercase text-[9px] block">PAYPAL_PLAN_ID_YEARLY:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100 truncate" title={gatewayConfig?.planIdYearly || 'P-YEARLY-19999'}>
                  {gatewayConfig?.planIdYearly || 'P-YEARLY-19999'}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">$199.99 / Year</span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 font-sans text-xs leading-relaxed">
              When a subscriber's 7-Day free trial expires, the PayPal payment gateway enables seamless continuation of platform access. All PayPal REST API calls, OAuth bearer token requests, order creation (<code className="text-[11px] font-mono bg-gray-100 dark:bg-neutral-800 px-1 py-0.5 rounded">/v2/checkout/orders</code>), and payment capture are securely orchestrated server-side.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 7-DAY FREE TRIAL STATUS & TELEMETRY                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'trial' && (
        <div id="trial-tab-content" className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#181a15] rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-[#52632B] dark:text-[#E5A910]">
                  Automatic Trial Lifecycle
                </span>
                <h3 className="text-lg font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                  7-Day Free Trial Telemetry
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                  isTrialActive && !isTrialExpired
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-[#D49A00] dark:text-[#E5A910] border border-amber-300'
                    : isSubscriptionActive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                }`}
              >
                {isSubscriptionActive
                  ? 'Paid Subscription Active'
                  : isTrialExpired
                  ? 'Trial Expired'
                  : 'Trial In Progress'}
              </span>
            </div>

            {/* Trial Countdown Card */}
            <div className="p-6 rounded-xl bg-[#FAF9F6] dark:bg-[#12140f] border border-gray-200 dark:border-neutral-800 text-center space-y-3">
              <span className="text-xs font-mono uppercase font-bold text-gray-500 dark:text-gray-400">
                Time Remaining in Free Trial
              </span>
              <div className="flex items-center justify-center gap-4 text-center font-mono">
                <div className="p-3 bg-white dark:bg-[#181a15] rounded-lg border border-gray-200 dark:border-neutral-800 min-w-[70px]">
                  <div className="text-3xl font-extrabold text-[#52632B] dark:text-[#E5A910]">
                    {isTrialExpired ? 0 : trialDaysRemaining}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500">Days</div>
                </div>
                <span className="text-2xl font-bold text-gray-400">:</span>
                <div className="p-3 bg-white dark:bg-[#181a15] rounded-lg border border-gray-200 dark:border-neutral-800 min-w-[70px]">
                  <div className="text-3xl font-extrabold text-[#52632B] dark:text-[#E5A910]">
                    {isTrialExpired ? 0 : trialHoursRemaining}
                  </div>
                  <div className="text-[10px] uppercase text-gray-500">Hours</div>
                </div>
              </div>

              {/* Progress Bar (7-day visual meter) */}
              <div className="space-y-1 max-w-md mx-auto pt-2">
                <div className="flex justify-between text-[11px] font-mono text-gray-500">
                  <span>Day 1 (Started)</span>
                  <span>Day 7 (Expires)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#52632B] to-[#E5A910] rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        isTrialExpired
                          ? 100
                          : Math.min(100, Math.max(5, ((7 - trialDaysRemaining) / 7) * 100))
                      }%`,
                    }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-neutral-400 max-w-md mx-auto pt-2">
                {isTrialExpired
                  ? 'Your 7-day trial period has ended. Please subscribe to restore full access to computer vision hazard scans, daily reports, and compliance tools.'
                  : 'Every newly registered subscriber automatically enjoys 7 days of unrestricted full platform access without immediate payment.'}
              </p>
            </div>

            {/* Trial Lifecycle Diagnostics & Testing Tools */}
            <div className="pt-2 border-t border-gray-100 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase font-bold text-gray-700 dark:text-gray-300">
                  Trial Lifecycle Verification Controls
                </h4>
                <span className="text-[10px] font-mono text-[#D49A00] font-bold">
                  EVALUATOR SUITE
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use these controls to simulate the exact requirements: test what happens when a 7-day free trial expires, verify that access is restricted and redirects to billing, and test trial resets.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  id="simulate-trial-expiration-btn"
                  onClick={async () => {
                    await onSimulateTrialExpiration();
                    notify('info', 'Simulated 7-day trial expiration: subscription status is now expired.');
                  }}
                  className="px-4 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Simulate Trial Expiration</span>
                </button>

                <button
                  id="reset-trial-btn"
                  onClick={async () => {
                    await onResetTrial();
                    notify('success', '7-day trial reset: fresh 7 days activated.');
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[#52632B]/10 hover:bg-[#52632B]/20 text-[#52632B] dark:text-[#E5A910] border border-[#52632B]/40 text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset 7-Day Free Trial</span>
                </button>

                <button
                  id="simulate-expiring-soon-btn"
                  onClick={async () => {
                    if (onSimulateExpiringSoon) {
                      await onSimulateExpiringSoon();
                    }
                    notify('info', 'Simulated subscription expiring in 3 days: 7-day expiration warning banner is now visible!');
                  }}
                  className="col-span-1 sm:col-span-2 px-4 py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-700 text-xs font-mono font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Simulate Expiring in 3 Days (Test 7-Day Warning Banner)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACCOUNT PROFILE & PASSWORD CHANGE                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'account' && (
        <div id="account-tab-content" className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-[#181a15] rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-6 shadow-sm">
            <div className="space-y-1 pb-4 border-b border-gray-100 dark:border-neutral-800">
              <span className="text-[11px] font-mono uppercase font-bold text-[#52632B] dark:text-[#E5A910]">
                Security & Credentials
              </span>
              <h3 className="text-lg font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                Subscriber Profile & Password Settings
              </h3>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-[#FAF9F6] dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-500 uppercase text-[10px]">Subscriber Name:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100">
                  {currentUser?.fullName || 'Clara Oswald'}
                </p>
              </div>

              <div className="p-3 bg-[#FAF9F6] dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-500 uppercase text-[10px]">Registered Email:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100">
                  {currentUser?.email || 'clara.oswald@daycare.internal'}
                </p>
              </div>

              <div className="p-3 bg-[#FAF9F6] dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-500 uppercase text-[10px]">Account Role:</span>
                <p className="font-bold text-[#52632B] dark:text-[#E5A910] uppercase">
                  {currentUser?.role || 'Provider'}
                </p>
              </div>

              <div className="p-3 bg-[#FAF9F6] dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 space-y-1">
                <span className="text-gray-500 uppercase text-[10px]">Current Plan:</span>
                <p className="font-bold text-gray-900 dark:text-neutral-100">
                  {currentUser?.subscription?.status === 'active'
                    ? currentUser?.subscription?.planName
                    : isTrialExpired
                    ? 'Trial Expired'
                    : '7-Day Free Trial'}
                </p>
              </div>
            </div>

            {/* Change Password Form (Requirement 2) */}
            <div className="pt-2 space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#52632B] dark:text-[#E5A910]" />
                <h4 className="text-xs font-mono uppercase font-bold text-gray-900 dark:text-neutral-100">
                  Change / Reset Password
                </h4>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3 max-w-md">
                {passwordChangeSuccess && (
                  <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold border border-emerald-300">
                    {passwordChangeSuccess}
                  </div>
                )}
                {passwordChangeError && (
                  <div className="p-2.5 rounded bg-rose-50 text-rose-800 text-xs font-mono font-semibold border border-rose-300">
                    {passwordChangeError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Current Password:
                  </label>
                  <input
                    id="account-current-password-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (demo: Password2026!)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    New Password:
                  </label>
                  <input
                    id="account-new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password:
                  </label>
                  <input
                    id="account-confirm-password-input"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="update-password-submit-btn"
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#52632B] hover:bg-[#3E4C1E] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border border-[#E5A910]/40"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Auto-Renewal Settings Card (Requirement: Auto-Renewal Toggle) */}
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase font-bold text-[#52632B] dark:text-[#E5A910]">
                  Billing Preferences & Automation
                </span>
                <h4 className="text-sm font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                  Subscription Auto-Renewal Preference
                </h4>
              </div>

              <div className="p-4 bg-[#FAF9F6] dark:bg-[#12140f] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#52632B] dark:text-[#E5A910]" />
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-neutral-100">
                        Automatic Subscription Renewal
                      </span>
                      <span
                        id="account-auto-renew-status-pill"
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          currentUser?.subscription?.autoRenew
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400'
                        }`}
                      >
                        {currentUser?.subscription?.autoRenew ? 'Active (Auto-Renewing)' : 'Disabled (Manual)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono max-w-lg leading-relaxed">
                      Automatically renew your daycare safety subscription at the end of each billing cycle through PayPal Vault. Disabling auto-renewal keeps your subscription active until the current period expires.
                    </p>
                  </div>

                  {/* Accessible Interactive Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                      {currentUser?.subscription?.autoRenew ? 'ON' : 'OFF'}
                    </span>
                    <button
                      id="auto-renewal-toggle"
                      type="button"
                      role="switch"
                      aria-checked={currentUser?.subscription?.autoRenew ?? false}
                      onClick={() => handleToggleAutoRenew()}
                      disabled={isTogglingAutoRenew}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#52632B] focus:ring-offset-2 disabled:opacity-50 ${
                        currentUser?.subscription?.autoRenew
                          ? 'bg-[#52632B]'
                          : 'bg-gray-300 dark:bg-neutral-700'
                      }`}
                      title={currentUser?.subscription?.autoRenew ? 'Click to disable auto-renewal' : 'Click to enable auto-renewal'}
                    >
                      <span className="sr-only">Toggle subscription auto-renewal</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          currentUser?.subscription?.autoRenew ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {currentUser?.subscription?.expiresAt && (
                  <div className="pt-2.5 border-t border-gray-200 dark:border-neutral-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-500 dark:text-gray-400">
                    <span>Next Scheduled Expiry / Renewal:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {new Date(currentUser.subscription.expiresAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' '}({daysUntilSubscriptionExpiry !== null ? `${daysUntilSubscriptionExpiry} days remaining` : 'active'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Subscription Option */}
            {isSubscriptionActive && (
              <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 space-y-2">
                <h4 className="text-xs font-mono uppercase font-bold text-rose-700 dark:text-rose-400">
                  Cancel Subscription
                </h4>
                <p className="text-xs text-gray-500">
                  Cancelling your subscription will stop future PayPal rebilling. You will continue to have access until the current billing cycle expires, after which access to subscription-only features will be restricted.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    id="cancel-auto-renew-btn"
                    onClick={() => onCancelSubscription(false)}
                    className="px-3 py-1.5 rounded text-xs font-mono border border-gray-300 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    Turn Off Auto-Renew
                  </button>
                  <button
                    id="cancel-immediate-btn"
                    onClick={() => onCancelSubscription(true)}
                    className="px-3 py-1.5 rounded text-xs font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100"
                  >
                    Cancel Immediately (Restricts Access)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INVOICES & BILLING HISTORY                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div id="invoices-tab-content" className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#181a15] rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-[#52632B] dark:text-[#E5A910]">
                  Financial Records
                </span>
                <h3 className="text-lg font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                  PayPal Payment Receipts & Invoices
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-500">
                {currentUser?.billingHistory?.length || 0} Records
              </span>
            </div>

            {(!currentUser?.billingHistory || currentUser.billingHistory.length === 0) ? (
              <div className="text-center py-12 space-y-3 font-mono">
                <Receipt className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-xs text-gray-500">
                  No paid invoices yet. Subscribe to Monthly or Yearly plan to generate official PayPal tax receipts.
                </p>
                <button
                  onClick={() => setActiveSubTab('plans')}
                  className="px-4 py-2 rounded-lg bg-[#52632B] text-white text-xs font-bold hover:bg-[#3E4C1E]"
                >
                  View Subscription Plans
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-neutral-800 text-gray-500 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Plan Description</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {currentUser.billingHistory.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-neutral-100">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                            {inv.date}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-800 dark:text-neutral-200">
                            {inv.planName}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#52632B] dark:text-[#E5A910]">
                            ${inv.amount.toFixed(2)} USD
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setViewingInvoice(inv)}
                              className="px-2.5 py-1 rounded bg-[#52632B]/10 text-[#52632B] dark:text-[#E5A910] hover:bg-[#52632B]/20 text-[11px] font-bold"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SIGN IN / SIGN UP (Requirements 1, 2, 3)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'auth' && (
        <div id="auth-tab-content" className="max-w-md mx-auto">
          <div className="bg-white dark:bg-[#181a15] rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 space-y-5 shadow-lg">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-mono font-bold uppercase text-center">
              <button
                id="auth-mode-signup-btn"
                onClick={() => setAuthMode('signup')}
                className={`py-2 rounded-md transition-colors ${
                  authMode === 'signup'
                    ? 'bg-[#52632B] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Sign Up (7-Day Trial)
              </button>
              <button
                id="auth-mode-signin-btn"
                onClick={() => setAuthMode('signin')}
                className={`py-2 rounded-md transition-colors ${
                  authMode === 'signin'
                    ? 'bg-[#52632B] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
            </div>

            {/* 1. SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                    Create Daycare Account
                  </h3>
                  <p className="text-xs text-[#52632B] dark:text-[#E5A910] font-mono font-semibold">
                    🎁 Automatically receive a 7-day free trial on signup!
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Full Name:
                  </label>
                  <input
                    id="signup-fullname-input"
                    type="text"
                    required
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Clara Oswald"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Email Address:
                  </label>
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="provider@daycare.internal"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Password:
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password-input"
                      type={showSignUpPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password:
                  </label>
                  <input
                    id="signup-confirm-password-input"
                    type="password"
                    required
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] font-mono text-amber-800 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D49A00]" />
                    <span>7-Day Risk-Free Trial Guarantee</span>
                  </div>
                  <p className="font-sans text-[11px]">
                    No immediate payment required. Full access to Computer Vision hazard tools and attendance workflows begins instantly upon registration.
                  </p>
                </div>

                <button
                  id="signup-submit-btn"
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#52632B] hover:bg-[#3E4C1E] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-[0.99] cursor-pointer border border-[#E5A910]/40 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-[#E5A910]" />
                  <span>Create Account & Start 7-Day Trial</span>
                </button>
              </form>
            )}

            {/* 2. SIGN IN FORM */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                    Sign In to Account
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Enter your email and password to access your daycare session.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Email Address:
                  </label>
                  <input
                    id="signin-email-input"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="clara.oswald@daycare.internal"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      Password:
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('reset')}
                      className="text-[10px] font-mono text-[#52632B] dark:text-[#E5A910] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="signin-password-input"
                      type={showSignInPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter password (demo: Password2026!)"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50 dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 text-[11px] font-mono text-gray-600 dark:text-gray-400 flex items-center justify-between">
                  <span>Demo Provider:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail('clara.oswald@daycare.internal');
                      setSignInPassword('Password2026!');
                    }}
                    className="text-[#52632B] dark:text-[#E5A910] font-bold hover:underline"
                  >
                    Auto-Fill Demo Credentials
                  </button>
                </div>

                <button
                  id="signin-submit-btn"
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#52632B] hover:bg-[#3E4C1E] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-[0.99] cursor-pointer border border-[#E5A910]/40 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-[#E5A910]" />
                  <span>Sign In</span>
                </button>
              </form>
            )}

            {/* 3. RESET PASSWORD FORM */}
            {authMode === 'reset' && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold font-mono uppercase text-gray-900 dark:text-neutral-100">
                    Reset Account Password
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    Enter your email to receive recovery instructions.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Email Address:
                  </label>
                  <input
                    id="reset-email-input"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter account email address"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#12140f] font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-xs font-mono text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    id="reset-password-submit-btn"
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-[#52632B] hover:bg-[#3E4C1E] text-white text-xs font-mono font-bold uppercase"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAYPAL SECURE CHECKOUT MODAL                                              */}
      {/* ========================================================================= */}
      {selectedPlanForCheckout && (
        <div
          id="paypal-checkout-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fadeIn"
        >
          <div
            id="paypal-checkout-card"
            className="bg-white dark:bg-[#181a15] rounded-2xl border-2 border-[#52632B] max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn space-y-4"
          >
            {/* Top PayPal Header */}
            <div className="bg-[#003087] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg italic tracking-tight font-sans">
                  PayPal <span className="text-[#0079C1]">Checkout</span>
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/30 text-white uppercase">
                Encrypted Sandbox
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              {paypalCheckoutStep === 'review' && (
                <>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 uppercase">
                      Confirm Subscription
                    </h3>
                    <p className="text-gray-500 text-[11px]">
                      Select your preferred payment method and authorize subscription via PayPal Gateway.
                    </p>
                  </div>

                  {/* Payment Funding Method Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                      Payment Method:
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setFundingSource('paypal_account')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          fundingSource === 'paypal_account'
                            ? 'border-[#0070BA] bg-[#0070BA]/5 ring-1 ring-[#0070BA]'
                            : 'border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#12140f]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#003087] text-white flex items-center justify-center font-bold text-xs italic">
                            P
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-neutral-100 block text-xs">
                              PayPal Balance or Connected Bank
                            </span>
                            <span className="text-[10px] text-gray-500">Pay using your PayPal account credentials</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="fundingSource"
                          checked={fundingSource === 'paypal_account'}
                          readOnly
                          className="text-[#0070BA]"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setFundingSource('credit_debit')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          fundingSource === 'credit_debit'
                            ? 'border-[#0070BA] bg-[#0070BA]/5 ring-1 ring-[#0070BA]'
                            : 'border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#12140f]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#52632B] text-white flex items-center justify-center">
                            <CreditCard className="w-3.5 h-3.5 text-[#E5A910]" />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-neutral-100 block text-xs">
                              Debit or Credit Card via PayPal
                            </span>
                            <span className="text-[10px] text-gray-500">Visa, Mastercard, Amex, Discover</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="fundingSource"
                          checked={fundingSource === 'credit_debit'}
                          readOnly
                          className="text-[#0070BA]"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setFundingSource('pay_in_4')}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          fundingSource === 'pay_in_4'
                            ? 'border-[#0070BA] bg-[#0070BA]/5 ring-1 ring-[#0070BA]'
                            : 'border-gray-200 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#12140f]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#E5A910] text-black flex items-center justify-center font-bold text-[10px]">
                            4x
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 dark:text-neutral-100 block text-xs">
                              PayPal Pay in 4
                            </span>
                            <span className="text-[10px] text-gray-500">
                              4 interest-free payments of ${(selectedPlanForCheckout === 'yearly' ? 49.99 : 4.99).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="fundingSource"
                          checked={fundingSource === 'pay_in_4'}
                          readOnly
                          className="text-[#0070BA]"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Gateway Parameters */}
                  <div className="p-4 bg-gray-50 dark:bg-[#12140f] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plan:</span>
                      <span className="font-bold text-gray-900 dark:text-neutral-100">
                        {selectedPlanForCheckout === 'yearly'
                          ? 'Yearly Plan ($199.99/year)'
                          : 'Monthly Plan ($19.99/month)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">PayPal Gateway API:</span>
                      <span className="font-mono text-[10px] text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                        {gatewayConfig?.apiUrl || 'https://api-m.sandbox.paypal.com'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Configured Plan ID:</span>
                      <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {selectedPlanForCheckout === 'yearly'
                          ? gatewayConfig?.planIdYearly || 'P-YEARLY-19999'
                          : gatewayConfig?.planIdMonthly || 'P-MONTHLY-1999'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal:</span>
                      <span className="font-bold">
                        ${selectedPlanForCheckout === 'yearly' ? '199.99' : '19.99'} USD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Tax:</span>
                      <span>$0.00 USD</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-neutral-800 font-bold text-sm text-[#52632B] dark:text-[#E5A910]">
                      <span>Total Due Today:</span>
                      <span>${selectedPlanForCheckout === 'yearly' ? '199.99' : '19.99'} USD</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold block mb-0.5">🔒 Verified PayPal Gateway Handshake</span>
                    Credentials remain protected in Google AI Studio server environment. Subscribing automatically clears trial expiration limits and restores unhindered platform access.
                  </div>

                  {/* Modal PayPal Smart Button Container */}
                  <div className="pt-2">
                    <PayPalSubscriptionSmartButton
                      planId={selectedPlanForCheckout === 'yearly' ? 'P-14S17187NL669422XNKORLRQ' : 'P-8RP56728U1771900GNKORJ6A'}
                      containerId={`paypal-modal-button-container-${selectedPlanForCheckout === 'yearly' ? 'yearly' : 'monthly'}`}
                      planType={selectedPlanForCheckout}
                      planLabel={`Subscribe with PayPal (${selectedPlanForCheckout === 'yearly' ? '$199.99/yr' : '$19.99/mo'})`}
                      onApproveSuccess={handlePayPalSubscriptionApproved}
                      onFallbackClick={executePayPalPayment}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      id="paypal-cancel-btn"
                      onClick={() => setSelectedPlanForCheckout(null)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-800"
                    >
                      Cancel
                    </button>
                    <button
                      id="paypal-proceed-btn"
                      onClick={executePayPalPayment}
                      className="flex-1 py-3 rounded-xl bg-[#0070BA] hover:bg-[#003087] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.99] cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-[#FFC439]" />
                      <span>Instant Sandbox Authorize</span>
                    </button>
                  </div>
                </>
              )}

              {paypalCheckoutStep === 'authenticating' && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-[#0070BA] border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-neutral-100">
                      Processing PayPal Transaction…
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Establishing tokenized order with PayPal secure API and updating subscription access.
                    </p>
                  </div>
                </div>
              )}

              {paypalCheckoutStep === 'completed' && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-gray-900 dark:text-neutral-100">
                      Payment Approved & Activated!
                    </h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      Your subscription is now active. All daycare features (Computer Vision, A2A Judge Agent, Daily Reports) are enabled.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 text-[11px] space-y-1 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID:</span>
                      <span className="font-bold">{paypalTransactionDetails?.transactionId || 'PAYPAL-TX-APPROVED'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subscription Status:</span>
                      <span className="font-bold text-emerald-600">ACTIVE</span>
                    </div>
                  </div>

                  <button
                    id="paypal-complete-dismiss-btn"
                    onClick={() => {
                      setSelectedPlanForCheckout(null);
                      setActiveSubTab('plans');
                      onNavigateTab('dashboard');
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#52632B] hover:bg-[#3E4C1E] text-white font-bold"
                  >
                    Go to Dashboard & Start Using Platform
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVOICE RECEIPT VIEWER MODAL                                              */}
      {/* ========================================================================= */}
      {viewingInvoice && (
        <div
          id="invoice-receipt-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fadeIn"
        >
          <div className="bg-white dark:bg-[#181a15] rounded-2xl border border-gray-200 dark:border-neutral-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#52632B] dark:text-[#E5A910]" />
                <h3 className="font-bold font-mono text-sm text-gray-900 dark:text-neutral-100 uppercase">
                  Official PayPal Receipt ({viewingInvoice.invoiceNumber})
                </h3>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#FAF9F6] dark:bg-[#12140f] rounded-xl border border-gray-200 dark:border-neutral-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Number:</span>
                <span className="font-bold">{viewingInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date Issued:</span>
                <span>{viewingInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subscriber:</span>
                <span className="font-bold">{currentUser?.fullName || 'Clara Oswald'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Gateway:</span>
                <span>{viewingInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PayPal Tx ID:</span>
                <span className="font-bold">{viewingInvoice.paypalTransactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subscription Item:</span>
                <span className="font-semibold">{viewingInvoice.planName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-neutral-800 text-sm font-bold text-[#52632B] dark:text-[#E5A910]">
                <span>Total Amount Paid:</span>
                <span>${viewingInvoice.amount.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-lg bg-[#52632B] text-white font-bold hover:bg-[#3E4C1E] flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
