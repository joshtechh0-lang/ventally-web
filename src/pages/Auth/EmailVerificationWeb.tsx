import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { OTPInput } from '../../components/Shared/OTPInput';
import { ArrowLeft, Info } from 'lucide-react';
import { AuthPageFrame } from '../../components/ui/AuthPageFrame';
import { requestPasswordReset } from '../../api/authApi';
import { useResendCooldown } from '../../hooks/useResendCooldown';

export const EmailVerificationWeb = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const stateEmail = (location.state as { email?: string })?.email ?? '';
  const emailParam = searchParams.get('email') ?? '';
  const email = stateEmail || emailParam;

  const otpParam = searchParams.get('otp') ?? '';
  const initialCode = /^\d{4}$/.test(otpParam) ? otpParam : '';

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const submitCode = (otp: string) => {
    if (otp.length !== 4 || !email) return;
    setLoading(true);
    setError('');
    navigate('/forgot-password/new-password', { state: { email, code: otp } });
    setLoading(false);
  };

  useEffect(() => {
    if (autoSubmittedRef.current) return;
    if (initialCode && email) {
      autoSubmittedRef.current = true;
      submitCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, email]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    submitCode(code);
  };

  const { canResend, formatted: cooldownLabel, startCooldown } = useResendCooldown(email);

  const handleResend = async () => {
    if (!email || !canResend) return;
    setResendLoading(true);
    setError('');
    setInfo('');
    try {
      await requestPasswordReset(email);
      startCooldown();
      setInfo(t('EmailVerification.resentNotice', 'A new code has been sent to your email.'));
    } catch (err: any) {
      setError(err?.error || err?.message || t('Common.error', 'Could not resend'));
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <AuthPageFrame>
      <div className="auth-card animate-slide-up relative text-center">
        <button
          onClick={() => navigate(-1)}
          className="text-white/80 hover:text-white flex items-center gap-2 mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> {t('Common.back', 'Back')}
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 mt-10">{t('EmailVerification.title')}</h2>
        <p className="text-sm text-white/80 mb-8 leading-relaxed">
          {t('EmailVerification.subtitle')}
          <br />
          <span className="text-gray-300 font-medium">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <OTPInput value={code} onChange={setCode} cellCount={4} />

          <div className="flex items-start gap-2.5 text-left text-xs text-white/60 mt-6 max-w-sm mx-auto leading-relaxed">
            <Info size={16} className="shrink-0 text-white/60 mt-0.5" />
            <span>
              {t('EmailVerification.infoTextEmail', "Verification emails may take a few minutes to arrive. Please check your Spam or Promotions folder if you do not see it. Your code will remain valid for up to 1 hour, and new codes can be requested after 2 minutes.")}
            </span>
          </div>

          {error ? (
            <p className="text-sm text-error bg-error/8 border border-error/20 rounded-xl px-3 py-2 text-center">{error}</p>
          ) : null}
          {info ? (
            <p className="text-sm text-white/80 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-center">{info}</p>
          ) : null}

          <p className="text-sm text-white/80">
            {t('EmailVerification.didntReceive')}{' '}
            <button
              type="button"
              disabled={resendLoading || !canResend}
              onClick={handleResend}
              className="text-white hover:text-primary transition-colors font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline disabled:hover:text-white"
            >
              {canResend
                ? t('EmailVerification.resend')
                : t('EmailVerification.resendIn', 'Resend in {{time}}', { time: cooldownLabel })}
            </button>
          </p>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading || code.length !== 4}>
            {t('EmailVerification.verifyAccount')}
          </Button>
        </form>
      </div>
    </AuthPageFrame>
  );
};
