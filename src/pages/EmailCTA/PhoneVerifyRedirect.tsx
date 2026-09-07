import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { AuthPageFrame } from '../../components/ui/AuthPageFrame';
import { Button } from '../../components/ui/Button';
import { verifyPhoneChangeOtp } from '../../api/authApi';

type Status = 'loading' | 'success' | 'error' | 'invalid';

const roleHome = (role?: string) => {
  if (role === 'listener') return '/listener';
  if (role === 'admin' || role === 'sub_admin') return '/admin';
  return '/venter';
};

export const PhoneVerifyRedirect = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const phone = params.get('phone') ?? '';
  const otp = params.get('otp') ?? '';
  const user = useSelector((s: RootState) => s.user.user as any);

  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (!phone || !/^\d{4}$/.test(otp)) {
      ranRef.current = true;
      setStatus('invalid');
      setMessage('Verification link is incomplete or malformed.');
      return;
    }
    ranRef.current = true;
    (async () => {
      try {
        const res = await verifyPhoneChangeOtp(phone, otp) as any;
        if (res?.success === false) {
          setStatus('error');
          setMessage(res?.message || res?.error || 'Verification failed.');
          return;
        }
        setStatus('success');
        setTimeout(() => navigate(roleHome(user?.userType || user?.role), { replace: true }), 1500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.error || err?.message || 'Verification failed.');
      }
    })();
  }, [phone, otp, navigate, user]);

  return (
    <AuthPageFrame>
      <div className="auth-card animate-slide-up w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Verifying your phone…</h2>
            <p className="text-sm text-white/70">This will take a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Phone verified</h2>
            <p className="text-sm text-white/80">Taking you to your dashboard…</p>
          </>
        )}
        {(status === 'error' || status === 'invalid') && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">We couldn't verify your phone</h2>
            <p className="text-sm text-error mb-6">{message}</p>
            <Button variant="primary" fullWidth onClick={() => navigate('/login', { replace: true })}>
              Go to login
            </Button>
          </>
        )}
      </div>
    </AuthPageFrame>
  );
};
