import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { OTPInput } from '../../components/Shared/OTPInput';
import { useCredentialsChange } from '../../api/hooks/useCredentialsChange';
import { logout } from '../../store/slices/userSlice';
import { toastSuccess, toastError } from '../../utils/toast';
import { CheckCircle } from 'lucide-react';

export const CredentialChangeOTP = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { verifyEmailChangeOTP, verifyPhoneChangeOTP, requestEmailChangeOTP, requestPhoneChangeOTP } =
    useCredentialsChange();

  // Params passed via navigate state from UpdateEmail / UpdatePhone
  const type: 'email' | 'phone' = (location.state as any)?.type || 'email';
  const newValue: string = (location.state as any)?.newValue || '';
  const isEmail = type === 'email';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-redirect after success
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      if (isEmail) {
        dispatch(logout() as any);
        navigate('/login', { replace: true });
      } else {
        navigate(-1);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [success, isEmail, dispatch, navigate]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 4) {
      toastError(t('Common.pleaseCompleteAllFields', 'Please enter the full 4-digit code'));
      return;
    }
    setLoading(true);
    try {
      if (isEmail) {
        await verifyEmailChangeOTP(newValue, code);
      } else {
        await verifyPhoneChangeOTP(newValue, code);
      }
      setSuccess(true);
    } catch (error: any) {
      toastError(error?.error || error?.message || t('Common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  }, [code, isEmail, newValue, verifyEmailChangeOTP, verifyPhoneChangeOTP, t]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      if (isEmail) {
        await requestEmailChangeOTP(newValue);
      } else {
        await requestPhoneChangeOTP(newValue);
      }
      toastSuccess(t('EmailVerification.otpSent', 'OTP sent successfully'));
      setResendCooldown(60);
    } catch (error: any) {
      toastError(error?.error || t('Common.somethingWentWrong'));
    } finally {
      setResendLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="page-wrapper animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white">
            {t('CredentialChangeOTP.successTitle', 'Updated Successfully')}
          </h2>
          <p className="text-sm text-white/60 max-w-xs">
            {isEmail
              ? t(
                  'CredentialChangeOTP.successMessageEmail',
                  'Your email has been updated. Please log in again with your new email.'
                )
              : t(
                  'CredentialChangeOTP.successMessagePhone',
                  'Your phone number has been updated successfully.'
                )}
          </p>
          <p className="text-xs text-white/40">
            {isEmail
              ? t('CredentialChangeOTP.redirectingLogin', 'Redirecting to login…')
              : t('CredentialChangeOTP.redirectingBack', 'Redirecting back…')}
          </p>
        </div>
      </div>
    );
  }

  // ── OTP entry ──────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper animate-fade-in">
      <PageHeader title="" onBack={() => navigate(-1)} />

      <GlassCard bordered>
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            {t('CredentialChangeOTP.title', 'Verify Your Change')}
          </h2>
          <p className="text-sm text-white/60">
            {isEmail
              ? t(
                  'CredentialChangeOTP.subtitleEmail',
                  `We sent a 4-digit code to ${newValue}. Enter it below to confirm your new email.`
                )
              : t(
                  'CredentialChangeOTP.subtitlePhone',
                  `We sent a 4-digit code to ${newValue}. Enter it below to confirm your new phone number.`
                )}
          </p>
        </div>

        <div className="flex justify-center my-6">
          <OTPInput
            value={code}
            onChange={setCode}
            cellCount={4}
            onComplete={handleVerify}
          />
        </div>

        {/* Resend */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-sm text-white/60">
            {t('PasswordChangeOTP.didntReceive', "Didn't receive it?")}
          </span>
          <button
            className={`text-sm font-medium underline transition-opacity ${
              resendCooldown > 0 || resendLoading ? 'text-white/30 cursor-not-allowed' : 'text-white'
            }`}
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
          >
            {resendCooldown > 0
              ? `${t('PasswordChangeOTP.resend', 'Resend')} (${resendCooldown}s)`
              : t('PasswordChangeOTP.resend', 'Resend')}
          </button>
        </div>
      </GlassCard>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        disabled={code.length !== 4}
        onClick={handleVerify}
        className="mt-4"
      >
        {t('CredentialChangeOTP.verify', 'Verify')}
      </Button>
    </div>
  );
};
