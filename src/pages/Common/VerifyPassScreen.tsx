import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import apiInstance from '../../api/apiInstance';
import { toastSuccess, toastError } from '../../utils/toast';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const VERIFYPASS_VERIFY_URL_FALLBACK = 'https://verifypass.com/auth/1c6225a415';

const COMMUNITY_LABELS: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher / Educator',
  military: 'Active Military',
  veteran: 'Veteran',
  healthcare: 'Healthcare Worker',
  nonprofit: 'Non-Profit Employee',
};

function formatCommunityType(type: string | null | undefined): string {
  if (!type) return 'Community Member';
  return COMMUNITY_LABELS[type.toLowerCase()] ?? type;
}

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
interface VerifyPassStatus {
  isVerified: boolean;
  communityType?: string | null;
  discountPercent?: number;
  verifiedAt?: string;
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export const VerifyPassScreen = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState<VerifyPassStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef(false);

  // ── Fetch current verification status ──────────────────────────────────
  const fetchStatus = useCallback(async (): Promise<VerifyPassStatus | null> => {
    try {
      const res = await apiInstance.get('verify-pass/status');
      const data: VerifyPassStatus = res.data?.data ?? res.data;
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStatus().finally(() => setLoadingStatus(false));
  }, [fetchStatus]);

  // ── Get the VerifyPass URL (fall back to static URL on failure) ─────────
  const getVerifyUrl = useCallback(async (): Promise<string> => {
    try {
      const res = await apiInstance.get('verify-pass/url');
      const url: string | undefined = res.data?.data?.url ?? res.data?.url;
      if (url) return url;
    } catch {
      // silent — use fallback
    }
    return VERIFYPASS_VERIFY_URL_FALLBACK;
  }, []);

  // ── Poll for verification after the user returns from VerifyPass ────────
  const pollForVerification = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setPolling(true);

    const maxAttempts = 10;
    const intervalMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, intervalMs));
      const result = await fetchStatus();
      if (result?.isVerified) {
        setPolling(false);
        pollingRef.current = false;
        toastSuccess("🎉 You're verified! Your 20% community discount is now active.");
        return;
      }
    }

    // After 10 attempts (~20 s), let the user know it may take a moment
    setPolling(false);
    pollingRef.current = false;
    toastSuccess(
      'Verification submitted — your discount will be applied automatically once confirmed.',
    );
  }, [fetchStatus]);

  // ── When the browser tab becomes visible again, poll ────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && verifying) {
        setVerifying(false);
        pollForVerification();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [verifying, pollForVerification]);

  // ── Open VerifyPass in a new tab ────────────────────────────────────────
  const handleStartVerification = useCallback(async () => {
    setVerifying(true);
    const url = await getVerifyUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [getVerifyUrl]);

  // ── "I've completed verification" manual trigger ─────────────────────────
  const handleManualCheck = useCallback(() => {
    setVerifying(false);
    pollForVerification();
  }, [pollForVerification]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="page-wrapper page-wrapper--wide animate-fade-in">
        <PageHeader title="Community Discount" onBack={() => navigate(-1)} />
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const isVerified = status?.isVerified ?? false;
  const discount = status?.discountPercent ?? 20;

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <PageHeader
        title="Community Discount"
        subtitle="Verify your status for 20% off all sessions"
        onBack={() => navigate(-1)}
      />

      {/* ── Status card ── */}
      {isVerified ? (
        <GlassCard bordered padding="lg" className="mb-6">
          {/* Verified badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Verified</p>
              <p className="text-sm text-white/60">
                {formatCommunityType(status?.communityType)}
              </p>
            </div>
          </div>

          {/* Discount highlight */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-white/70">Your community discount</p>
            <p className="text-lg font-bold text-primary">{discount}% off</p>
          </div>

          {status?.verifiedAt && (
            <p className="text-xs text-white/40 mt-3 text-right">
              Verified on {new Date(status.verifiedAt).toLocaleDateString()}
            </p>
          )}
        </GlassCard>
      ) : (
        <GlassCard bordered padding="lg" className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-white">Community Discount — 20% Off</p>
              <p className="text-sm text-white/60">Qualifying members receive 20% off every session</p>
            </div>
          </div>

          {/* Who qualifies */}
          <div className="space-y-2 mt-2">
            {[
              'Students',
              'Teachers & Educators',
              'Active Military',
              'Veterans',
              'Healthcare Workers',
              'Non-Profit Employees',
            ].map(item => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-primary font-bold text-sm">•</span>
                <p className="text-sm text-white/80">{item}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── How it works ── */}
      <GlassCard bordered padding="lg" className="mb-6">
        <p className="text-sm font-semibold text-white mb-4">How It Works</p>
        <div className="space-y-4">
          {[
            {
              n: 1,
              text: 'Tap "Verify My Status" below.',
            },
            {
              n: 2,
              text: 'Complete the short verification form in a new tab.',
            },
            {
              n: 3,
              text: 'Return here — your discount is applied automatically.',
            },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{step.n}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── CTA ── */}
      {isVerified ? (
        <Button variant="glass-bordered" fullWidth onClick={() => navigate(-1)}>
          Done
        </Button>
      ) : polling ? (
        /* Polling state — waiting for webhook */
        <GlassCard bordered padding="lg" className="text-center">
          <Loader2 size={24} className="text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-white mb-1">Checking your verification…</p>
          <p className="text-xs text-white/50">This usually takes a few seconds.</p>
        </GlassCard>
      ) : verifying ? (
        /* User has opened the tab — show a "done" prompt */
        <GlassCard bordered padding="lg" className="space-y-3">
          <p className="text-sm text-white/70 text-center">
            Complete the form in the new tab, then come back here.
          </p>
          <Button
            variant="primary"
            fullWidth
            leftIcon={<CheckCircle size={16} />}
            onClick={handleManualCheck}
          >
            I've Completed Verification
          </Button>
          <Button variant="glass-bordered" fullWidth onClick={() => setVerifying(false)}>
            Cancel
          </Button>
        </GlassCard>
      ) : (
        <Button
          variant="primary"
          fullWidth
          leftIcon={<ExternalLink size={16} />}
          onClick={handleStartVerification}
        >
          Verify My Status
        </Button>
      )}
    </div>
  );
};
