import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const EmailVerifyRedirect = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const otp = params.get('otp') ?? '';

  useEffect(() => {
    const query = new URLSearchParams();
    if (email) query.set('email', email);
    if (/^\d{4}$/.test(otp)) query.set('otp', otp);
    const qs = query.toString();
    navigate(`/signup/otp${qs ? `?${qs}` : ''}`, {
      replace: true,
      state: email ? { email } : undefined,
    });
  }, [email, otp, navigate]);

  return null;
};
