import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, AlertCircle, ShieldCheck } from 'lucide-react';
import { SubscriptionPlanId } from '../types';
import { safeFetchJson } from '../utils/apiClient';

interface PayPalClientConfig {
  clientId: string;
  currency: string;
  intent: string;
  vault: boolean;
  planIdMonthly: string;
  planIdYearly: string;
  environment: string;
  sdkUrl: string;
  source: string;
  status: string;
}

// Module-level promise cache to ensure SDK script is fetched and loaded only once
let paypalScriptLoadPromise: Promise<boolean> | null = null;

export const loadPayPalSdkScript = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  // If window.paypal already exists and has Buttons, it's ready
  if ((window as any).paypal?.Buttons) {
    return true;
  }

  if (paypalScriptLoadPromise) {
    return paypalScriptLoadPromise;
  }

  paypalScriptLoadPromise = (async () => {
    try {
      // 1. Fetch Client ID and SDK parameters securely from server-side route proxy
      const res = await safeFetchJson<PayPalClientConfig>('/api/subscription/paypal/client-config');
      if (!res.ok || !res.data?.clientId) {
        console.warn('PayPal client config could not be fetched from server route proxy:', res.error);
        return false;
      }

      const { clientId, sdkUrl } = res.data;

      // 2. Check if script tag already exists in DOM
      const existingScript = document.getElementById('paypal-sdk-script') as HTMLScriptElement | null;
      if (existingScript) {
        if ((window as any).paypal?.Buttons) return true;
        return new Promise<boolean>((resolve) => {
          existingScript.addEventListener('load', () => resolve(Boolean((window as any).paypal?.Buttons)));
          existingScript.addEventListener('error', () => resolve(false));
          setTimeout(() => resolve(Boolean((window as any).paypal?.Buttons)), 4000);
        });
      }

      // 3. Dynamically inject script into document.head
      return new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.id = 'paypal-sdk-script';
        script.src = sdkUrl || `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription`;
        script.setAttribute('data-sdk-integration-source', 'button-factory');
        script.async = true;

        script.onload = () => {
          if ((window as any).paypal?.Buttons) {
            resolve(true);
          } else {
            // Give brief moment for namespace initialization
            setTimeout(() => {
              resolve(Boolean((window as any).paypal?.Buttons));
            }, 100);
          }
        };

        script.onerror = (err) => {
          console.warn('PayPal JavaScript SDK failed to load from CDN:', err);
          resolve(false);
        };

        document.head.appendChild(script);
      });
    } catch (err) {
      console.warn('Exception during dynamic PayPal SDK loading:', err);
      return false;
    }
  })();

  return paypalScriptLoadPromise;
};

interface PayPalSubscriptionSmartButtonProps {
  planId: string; // 'P-8RP56728U1771900GNKORJ6A' | 'P-14S17187NL669422XNKORLRQ'
  containerId: string;
  planType: SubscriptionPlanId;
  planLabel: string;
  onApproveSuccess: (subscriptionId: string, planType: SubscriptionPlanId) => void;
  onFallbackClick?: () => void;
}

export const PayPalSubscriptionSmartButton: React.FC<PayPalSubscriptionSmartButtonProps> = ({
  planId,
  containerId,
  planType,
  planLabel,
  onApproveSuccess,
  onFallbackClick,
}) => {
  const [sdkStatus, setSdkStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const renderedRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const initButton = async () => {
      // 1. Ensure PayPal SDK script is loaded dynamically via server proxy
      const loaded = await loadPayPalSdkScript();
      if (isCancelled) return;

      if (!loaded) {
        setSdkStatus('fallback');
        return;
      }

      const paypal = (window as any).paypal;
      if (!paypal || !paypal.Buttons) {
        setSdkStatus('fallback');
        return;
      }

      const container = document.getElementById(containerId);
      if (!container) {
        return;
      }

      if (renderedRef.current && container.children.length > 0) {
        setSdkStatus('ready');
        return;
      }

      try {
        container.innerHTML = '';
        paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'gold',
            layout: 'vertical',
            label: 'subscribe',
          },
          createSubscription: async function (_data: any, actions: any) {
            try {
              const res = await fetch('/api/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data?.subscriptionID) {
                  return data.subscriptionID;
                }
              }
            } catch (err) {
              console.warn('Backend /api/create-subscription call fell back to client actions:', err);
            }
            return actions.subscription.create({
              /* Fallback client-side subscription creation */
              plan_id: planId,
            });
          },
          onApprove: function (data: any, _actions: any) {
            try {
              if (data?.subscriptionID) {
                alert(data.subscriptionID);
              }
            } catch {
              // Iframe sandbox may suppress native alert
            }
            if (data?.subscriptionID) {
              onApproveSuccess(data.subscriptionID, planType);
            }
          },
          onError: function (err: any) {
            console.warn(`PayPal button runtime error for ${planId}:`, err);
            if (!isCancelled) setSdkStatus('fallback');
          },
        }).render(`#${containerId}`);

        if (!isCancelled) {
          renderedRef.current = true;
          setSdkStatus('ready');
        }
      } catch (err) {
        console.warn('Error mounting PayPal Buttons:', err);
        if (!isCancelled) setSdkStatus('fallback');
      }
    };

    initButton();

    return () => {
      isCancelled = true;
    };
  }, [planId, containerId, planType, onApproveSuccess]);

  return (
    <div className="w-full space-y-2">
      {/* Primary Target Container requested for PayPal Smart Buttons */}
      <div
        id={containerId}
        ref={containerRef}
        className="w-full min-h-[38px] flex flex-col items-center justify-center transition-all"
      />

      {/* Loading Placeholder while server route proxy is contacted & SDK loads */}
      {sdkStatus === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-mono">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          <span>Retrieving credentials & connecting to PayPal SDK…</span>
        </div>
      )}

      {/* Graceful Fallback if adblocker or restricted network blocks paypal.com CDN */}
      {sdkStatus === 'fallback' && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onFallbackClick}
            className="w-full py-3 rounded-xl bg-[#FFC439] hover:bg-[#F2BA36] text-[#003087] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.99] cursor-pointer border border-[#003087]/20"
          >
            <CreditCard className="w-4 h-4 text-[#003087]" />
            <span>{planLabel} (PayPal Gateway)</span>
          </button>
          <p className="text-[10px] text-center text-gray-500 font-mono flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <span>Server proxy active • Instant Sandbox Authorization</span>
          </p>
        </div>
      )}
    </div>
  );
};
