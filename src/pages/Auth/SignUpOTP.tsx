import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';
import { OTPInput } from '../../components/Shared/OTPInput';
import { ArrowLeft, Info } from 'lucide-react';
import { verifyEmail, resendVerificationEmail } from '../../api';
import apiInstance from '../../api/apiInstance';
import { useAuth } from '../../api/hooks/useAuth';
import { AuthPageFrame } from '../../components/ui/AuthPageFrame';
import { useResendCooldown } from '../../hooks/useResendCooldown';

export const SignUpOTP = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const otpParam = searchParams.get('otp') ?? '';
  const emailParam = searchParams.get('email') ?? '';
  const initialCode = /^\d{4}$/.test(otpParam) ? otpParam : '';
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const autoSubmittedRef = useRef(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');

  // userType/email are carried in state from SignUpWeb, fall back to URL param, then Redux user
  const navState = (location.state ?? {}) as { email?: string; userType?: string };
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const email = navState.email || emailParam || reduxUser?.email || '';
  const userType = navState.userType || reduxUser?.userType || reduxUser?.role || 'venter';
  const { getProfile } = useAuth();

  /**
   * Navigate after OTP — Enforce parity showing Language Selection screen to both roles
   */
  const navigateAfterVerify = () => {
    navigate('/signup/terms', { state: { userType } });
  };

  const handleVerify = async (e?: React.FormEvent, codeOverride?: string) => {
    e?.preventDefault();
    const submitCode = codeOverride ?? code;
    if (submitCode.length !== 4 || !email) return;
    setError('');
    setLoading(true);
    try {
      const response = await verifyEmail(email, submitCode);
      if ((response as any).success !== false) {
        // Refresh profile so the venter welcome credit (10 min) lands in Redux
        // before any downstream screen reads `user.balance`.
        await getProfile().catch(() => {});
        navigateAfterVerify();
      } else {
        setError((response as any)?.message || (response as any)?.error || t('Common.error') || 'Verification failed');
      }
    } catch (err: any) {
      const errMsg = err?.error || err?.message || '';
      if (errMsg.toLowerCase().includes('expired')) {
        setError('Your code has expired. Please request a new one.');
      } else if (errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('incorrect')) {
        setError('Incorrect code. Please check and try again.');
      } else {
        setError(errMsg || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoSubmittedRef.current) return;
    if (initialCode && email && !loading) {
      autoSubmittedRef.current = true;
      handleVerify(undefined, initialCode);
    }
  }, [initialCode, email]);

  const { canResend, formatted: cooldownLabel, startCooldown } = useResendCooldown(email);

  const handleResend = async () => {
    if (!email) {
      setError('Email address is missing. Please restart signup.');
      return;
    }
    if (!canResend) return;
    setResendLoading(true);
    setError('');
    try {
      await resendVerificationEmail(email);
      startCooldown();
    } catch (err: any) {
      setError(err?.error || 'Could not resend');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthPageFrame>
      <div className="auth-card animate-slide-up w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white mb-2">
            {t('EmailVerification.title')}
          </h1>
          <p className="text-sm text-gray-400">
            {t('EmailVerification.subtitle')}{' '}
            {email ? <span className="text-primary">{email}</span> : null}
          </p>
          <p className="text-xs text-white/40 mt-2">
            A welcome email has also been sent to your inbox with getting started tips.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <OTPInput
            value={code}
            onChange={setCode}
            cellCount={4}
            onComplete={(completedCode) => handleVerify(undefined, completedCode)}
          />

          <div className="flex items-start gap-2.5 text-left text-xs text-white/60 mt-6 max-w-sm mx-auto leading-relaxed">
            <Info size={16} className="shrink-0 text-white/60 mt-0.5" />
            <span>
              {t('EmailVerification.infoTextEmail', "Verification emails may take a few minutes to arrive. Please check your Spam or Promotions folder if you do not see it. Your code will remain valid for up to 1 hour, and new codes can be requested after 2 minutes.")}
            </span>
          </div>
          <div className="mt-4 bg-white/5 rounded-2xl p-4 max-w-sm mx-auto">
            <p className="text-xs text-white/60 font-medium mb-2">📧 Not receiving the email?</p>
            <ul className="text-xs text-white/40 space-y-1">
              <li>• Check your Spam or Junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait up to 5 minutes and try resending</li>
              <li>• Contact support at info@ventally.co</li>
            </ul>
          </div>

          {error ? (
            <p className="text-sm text-error bg-error/8 border border-error/20 rounded-xl px-3 py-2 text-center">{error}</p>
          ) : null}

          <div className="text-center mt-6">
            <p className="text-sm text-white/80">
              {t('EmailVerification.didntReceive')}{' '}
              <button
                type="button"
                disabled={resendLoading || !canResend}
                onClick={handleResend}
                className="text-primary hover:text-primary-hover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-primary"
              >
                {resendLoading
                  ? 'Sending...'
                  : canResend
                    ? t('EmailVerification.resend')
                    : t('EmailVerification.resendIn', 'Resend in {{time}}', { time: cooldownLabel })}
              </button>
            </p>
          </div>

          <Button
            variant="primary"
            fullWidth
            className='!w-full'
            type="submit"
            loading={loading}
            disabled={code.length !== 4}
          >
            {t('EmailVerification.verifyAccount')}
          </Button>
        </form>
      </div>
    </AuthPageFrame>
  );
};
