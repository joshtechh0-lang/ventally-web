import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PasswordResetRedirect = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const otp = params.get('otp') ?? '';

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
      return;
    }
    const query = new URLSearchParams();
    query.set('email', email);
    if (/^\d{4}$/.test(otp)) query.set('otp', otp);
    navigate(`/forgot-password/verify-email?${query.toString()}`, {
      replace: true,
      state: { email },
    });
  }, [email, otp, navigate]);

  return null;
};
