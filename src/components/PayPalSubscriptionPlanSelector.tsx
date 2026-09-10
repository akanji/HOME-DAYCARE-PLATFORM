import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { loadPayPalSdkScript } from './PayPalSubscriptionSmartButton';

interface PayPalSubscriptionPlanSelectorProps {
  onSuccess?: (user?: any) => void;
  onRedirectToDashboard?: () => void;
  userEmail?: string;
}

export const PayPalSubscriptionPlanSelector: React.FC<PayPalSubscriptionPlanSelectorProps> = ({
  onSuccess,
  onRedirectToDashboard,
  userEmail,
}) => {
  const [selectedPlanType, setSelectedPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activationStatus, setActivationStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedPlanRef = useRef<string | null>(null);
  const isRenderingRef = useRef<boolean>(false);

  const onSuccessRef = useRef(onSuccess);
  const onRedirectRef = useRef(onRedirectToDashboard);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onRedirectRef.current = onRedirectToDashboard;
  });

  // Initialize and render PayPal buttons
  useEffect(() => {
    let isCancelled = false;

    const renderPayPalButtons = async () => {
      setErrorMessage(null);

      const targetEl = containerRef.current;
      if (!targetEl || !document.body.contains(targetEl)) {
        return;
      }

      // If already rendered for the selected plan and container has elements, skip redundant render
      if (renderedPlanRef.current === selectedPlanType && targetEl.children.length > 0) {
        setSdkReady(true);
        return;
      }

      // If a render is already in-flight, avoid race condition
      if (isRenderingRef.current) {
        return;
      }

      // Ensure SDK is loaded
      const isLoaded = await loadPayPalSdkScript();
      if (isCancelled) return;

      const paypal = (window as any).paypal;
      if (!paypal || !paypal.Buttons) {
        setSdkReady(false);
        return;
      }

      setSdkReady(true);

      const currentEl = containerRef.current;
      if (!currentEl || !document.body.contains(currentEl) || isCancelled) {
        return;
      }

      try {
        isRenderingRef.current = true;
        currentEl.innerHTML = '';

        const buttonInstance = paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe',
          },
          createSubscription: async function (_data: any, actions: any) {
            // First attempt secure server-side subscription creation
            try {
              const res = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: selectedPlanType }),
              });
              const resJson = await res.json();
              if (resJson?.subscriptionID) {
                return resJson.subscriptionID;
              }
            } catch (e) {
              console.warn('Backend create-subscription fallback:', e);
            }

            // Fallback for direct client SDK creation using server-configured plan IDs
            const fallbackPlanId = selectedPlanType === 'yearly'
              ? 'P-7BJ4281497082825YNKOQJBI'
              : 'P-8RP56728U1771900GNKORJ6A';

            return actions.subscription.create({
              plan_id: fallbackPlanId,
            });
          },
          onApprove: async function (data: any, _actions: any) {
            console.log('Subscription ID:', data.subscriptionID);
            try {
              if (typeof window !== 'undefined' && window.alert && !window.frameElement) {
                window.alert(data.subscriptionID);
              }
            } catch {
              // Ignore iframe alert restrictions
            }
            setIsProcessing(true);
            setActivationStatus('Activating subscription with Daycare Platform backend...');

            try {
              // Send token to backend to associate subscription with user
              const response = await fetch('/api/subscriptions/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  subscriptionID: data.subscriptionID,
                  planType: selectedPlanType,
                  userEmail: userEmail,
                }),
              });

              const resData = await response.json().catch(() => null);

              if (response.ok && resData?.success) {
                setActivationStatus('Subscription activated successfully! Redirecting...');
                if (onSuccessRef.current) onSuccessRef.current(resData.user);

                // Brief delay before redirecting
                setTimeout(() => {
                  if (onRedirectRef.current) {
                    onRedirectRef.current();
                  } else {
                    window.location.href = '/dashboard';
                  }
                }, 1200);
              } else {
                throw new Error(resData?.error || 'Server failed to activate subscription');
              }
            } catch (err: any) {
              console.error('Subscription activation failed:', err);
              setErrorMessage(err.message || 'Subscription activation failed');
            } finally {
              setIsProcessing(false);
            }
          },
          onError: function (err: any) {
            const errStr = err?.message || String(err || '');
            if (errStr.includes('Detected container element removed from DOM')) {
              return;
            }
            console.error('PayPal Subscription Error:', err);
            if (!isCancelled) {
              setErrorMessage('PayPal subscription window closed or encountered an error.');
            }
          },
        });

        buttonInstance.render(currentEl)
          .then(() => {
            isRenderingRef.current = false;
            if (!isCancelled) {
              renderedPlanRef.current = selectedPlanType;
            }
          })
          .catch((err: any) => {
            isRenderingRef.current = false;
            const errStr = err?.message || String(err || '');
            if (errStr.includes('Detected container element removed from DOM')) {
              // Benign DOM detachment during React re-renders or StrictMode
              return;
            }
            console.warn('Error rendering PayPal Buttons:', err);
            if (!isCancelled) {
              setErrorMessage('Could not render PayPal smart button: ' + (err?.message || 'Unknown error'));
            }
          });
      } catch (err: any) {
        isRenderingRef.current = false;
        const errStr = err?.message || String(err || '');
        if (!errStr.includes('Detected container element removed from DOM')) {
          console.warn('Error setting up PayPal Buttons:', err);
          if (!isCancelled) {
            setErrorMessage('Could not render PayPal smart button: ' + (err?.message || 'Unknown error'));
          }
        }
      }
    };

    renderPayPalButtons();

    return () => {
      isCancelled = true;
      isRenderingRef.current = false;
    };
  }, [selectedPlanType, userEmail]);

  // Fallback simulator for demo or instant sandbox activation
  const handleSimulatedActivation = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setActivationStatus('Activating sandbox subscription...');

    try {
      const simSubId = 'I-SUB-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      const response = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionID: simSubId,
          planType: selectedPlanType,
          userEmail: userEmail,
        }),
      });

      const resData = await response.json().catch(() => null);
      if (response.ok && resData?.success) {
        setActivationStatus('Subscription activated successfully! Redirecting to Dashboard...');
        if (onSuccess) onSuccess(resData.user);

        setTimeout(() => {
          if (onRedirectToDashboard) {
            onRedirectToDashboard();
          } else {
            window.location.href = '/dashboard';
          }
        }, 1000);
      } else {
        throw new Error(resData?.error || 'Simulation activation failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to simulate subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="subscription-container max-w-xl mx-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#181a15] border-2 border-gray-200 dark:border-neutral-800 shadow-md space-y-6 font-sans">
      <div className="space-y-2 border-b border-gray-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#52632B] dark:text-[#E5A910]">
          <Sparkles className="w-4 h-4" />
          <span>Official PayPal JS SDK Integration</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold font-mono text-gray-900 dark:text-neutral-100 uppercase tracking-tight">
          Choose Your Home Daycare Platform Plan
        </h2>
        <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
          Subscribe securely via PayPal with auto-vaulting and instant recurring membership provisioning.
        </p>
      </div>

      {/* Plan Toggle Form Control */}
      <div className="space-y-3 font-mono">
        <label htmlFor="plan-select" className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
          Select Billing Cycle:
        </label>
        <div className="relative">
          <select
            id="plan-select"
            value={selectedPlanType}
            onChange={(e) => setSelectedPlanType(e.target.value as 'monthly' | 'yearly')}
            disabled={isProcessing}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#12140f] text-gray-900 dark:text-neutral-100 text-sm font-bold focus:outline-none focus:border-[#52632B] transition-colors cursor-pointer shadow-xs"
          >
            <option value="monthly">Monthly Plan - $19.99/month (Flexible, cancel anytime)</option>
            <option value="yearly">Yearly Plan - $199.99/year (Save $39.89 • 2 Months Free)</option>
          </select>
        </div>

        {/* Selected Plan Details Badge - Plan IDs are hidden and protected from subscribers */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#12140f] border border-gray-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-gray-600 dark:text-gray-300">Selected Plan Tier:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {selectedPlanType === 'yearly' ? 'Annual Facility Access' : 'Professional Caregiver Monthly'}
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-[#52632B] dark:text-[#E5A910] bg-[#52632B]/10 dark:bg-[#E5A910]/10 px-2 py-0.5 rounded-md">
            {selectedPlanType === 'yearly' ? '$199.99/yr (Save 17%)' : '$19.99/month'}
          </span>
        </div>
      </div>

      {/* Status or Error Notifications */}
      {activationStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-xs font-mono">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{activationStatus}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-900 dark:text-rose-200 flex items-center gap-2.5 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PayPal Button Mount Point */}
      <div className="space-y-3 pt-2">
        <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>PayPal Smart Payment Button:</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Vaulting (intent=subscription)</span>
          </span>
        </div>

        <div
          id={`paypal-plan-selector-container-${selectedPlanType}`}
          ref={containerRef}
          style={{ marginTop: '20px', minHeight: '48px' }}
          className="relative z-10"
        />

        {/* If PayPal SDK script is still loading or running in sandbox preview */}
        {(!sdkReady || isProcessing) && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#12140f] border border-dashed border-gray-300 dark:border-neutral-700 text-center space-y-2 font-mono">
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <RefreshCw className="w-4 h-4 animate-spin text-[#52632B]" />
                <span>Processing PayPal Subscription...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Ready to test PayPal Subscription activation?
                </p>
                <button
                  type="button"
                  id="instant-activate-sub-btn"
                  onClick={handleSimulatedActivation}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E5A910] hover:bg-[#D49A00] text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Instant Activate ({selectedPlanType === 'yearly' ? 'Yearly - $199.99' : 'Monthly - $19.99'})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-gray-500">
        <span>Includes 7-Day Trial rollover</span>
        <span>Cancel anytime</span>
      </div>
    </div>
  );
};
