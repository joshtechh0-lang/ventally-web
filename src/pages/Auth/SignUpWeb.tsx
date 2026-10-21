import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { setTokens } from '../../api';
import apiInstance from '../../api/apiInstance';
import { useDispatch } from 'react-redux';
import { setUser, setAuthenticated, setIsVenter } from '../../store/slices/userSlice';
import { Mail, Lock } from 'lucide-react';
import { AuthPageFrame } from '../../components/ui/AuthPageFrame';
import { AppBrandIcon } from '../../components/ui/AppBrandIcon';

export const SignUpWeb = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: '',
    password: '',
    nickname: '',
    userType: '' as 'venter' | 'listener' | '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors((prev: any) => ({ ...prev, [key]: undefined, general: undefined }));
    if (key === 'password') {
      setPasswordChecks({
        length: val.length >= 8,
        uppercase: /[A-Z]/.test(val),
        lowercase: /[a-z]/.test(val),
        number: /\d/.test(val),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
      });
    }
  };

  const validatePassword = (pwd: string) => {
    if (!pwd) return 'Password is required';
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Add at least one uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Add at least one lowercase letter';
    if (!/\d/.test(pwd)) return 'Add at least one number';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Add at least one special character (!@#$...)';
    return '';
  };

  const validate = () => {
    const errs: any = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) errs.email = t('SignUp.error.validEmail', 'Valid email required');
    const pwdError = validatePassword(form.password);
    if (pwdError) errs.password = pwdError;
     
    if (!form.userType) errs.userType = t('SignUp.selectUsage', 'Please select how you will use the app');
    return errs;
  };

  const handleSignUp = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await apiInstance.post('auth/register', {
        email: form.email.trim(),
        password: form.password,
        userType: form.userType,
        displayName: form.nickname.trim() || undefined,
        referralCode: form.referralCode.trim() || undefined,
      });

      const data = res.data || res;

      if (data?.access_token && data?.refresh_token) {
        await setTokens(data.access_token, data.refresh_token);
      } else if (data?.tokens?.accessToken) {
        await setTokens(data.tokens.accessToken, data.tokens.refreshToken || '');
      }

      if (data?.user) {
        dispatch(setUser(data.user));
        dispatch(setIsVenter(data.user?.userType === 'venter'));
      }

      // Auto-activate free tier for new Venter users
      if (form.userType === 'venter') {
        try {
          await apiInstance.post('payments/activate-free-tier');
        } catch {
          // Silent fail — user can still sign up even if free tier activation fails
        }
      }

      // Apply referral code if provided
      if (form.referralCode.trim()) {
        try {
          await apiInstance.post('referrals/apply', { referralCode: form.referralCode.trim() });
        } catch {
          // Silent fail — referral is a bonus, not critical
        }
      }

      navigate('/signup/otp', { state: { email: form.email.trim(), userType: form.userType } });
    } catch (e: any) {
      setErrors({ general: e?.error || e?.message || t('SignUp.error.general', 'Registration failed. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageFrame>
      <div className="auth-card animate-slide-up w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <AppBrandIcon className="w-11 h-11 rounded-2xl" />
          <h1 className="text-xl font-bold text-white">{t('Common.appName', 'Ventally')}</h1>
        </div>

         <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white">
            {form.userType === 'listener' ? 'Become a Support Guide' : t('SignUp.title')}
          </h2>
          <Link to="/login" className="text-xs text-primary hover:text-primary-hover transition-colors">
            {t('SignUp.alreadyHaveAccount')} {t('SignUp.logIn')}
          </Link>
        </div>
        <p className="text-sm text-white/80 mb-3">
          {form.userType === 'listener' ? 'Help others. Earn. Make a difference.' : t('SignUp.subtitle', 'Start your wellness journey today')}
        </p>
        {form.userType === 'listener' && (
          <div className="flex items-center gap-2 mb-4 text-xs text-white/40">
            <span>⏱ ~10 min setup</span>
            <span>•</span>
            <span>📋 2hr training</span>
            <span>•</span>
            <span>✅ 24-48h approval</span>
          </div>
        )}

        <p className="text-sm font-medium text-white mb-2">{t('SignUp.howWillYouUse')}</p>
        <div className="flex gap-3 mb-2">
          {([
            { value: 'venter' as const, label: `I'm just trying to vent`, desc: 'Get anonymous support' },
            { value: 'listener' as const, label: `I'm a listener`, desc: 'Earn by supporting others' },
          ] as const).map(role => {
            const isSelected = form.userType === role.value;
            return (
              <button
                key={role.value}
                onClick={() => update('userType', role.value)}
                className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all duration-200 border ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_0_1px_var(--primary)] scale-[1.02]'
                    : 'bg-white/4 border-white/12 text-white/55 hover:bg-white/8 hover:border-white/20'
                }`}
              >
                <div>{role.label}</div>
                <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-white/70' : 'text-white/30'}`}>{role.desc}</div>
              </button>
            );
          })}
        </div>
        {form.userType === 'listener' && (
          <p className="text-xs text-white/50 mb-2 ml-1">
            You'll complete a short training and ID verification before going live. <span className="text-primary cursor-pointer" onClick={() => navigate('/signup/listener-what-to-expect')}>Learn what to expect →</span>
          </p>
        )}
        {errors.userType && (
          <p className="text-xs text-error mb-4 ml-1">{errors.userType}</p>
        )}

        <div className="space-y-4 mt-4">
          <Input
            label={t('SignUp.emailOrPhone', 'Email')}
            type="email"
            autoComplete="email"
            aria-label="Email address"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            error={errors.email}
            leftIcon={<Mail size={14} />}
          />
          <Input
            label="Nickname"
            type="text"
            placeholder="e.g. SunflowerMoon"
            autoComplete="nickname"
            aria-label="Choose a nickname — this is how others will see you"
            value={form.nickname}
            onChange={e => update('nickname', e.target.value.slice(0, 20))}
            hint={`${form.nickname.length}/20 — this is how others will see you`}
          />
          <Input
            label="Referral Code (optional)"
            placeholder="Enter referral code"
            value={form.referralCode}
            onChange={e => update('referralCode', e.target.value.toUpperCase().slice(0, 8))}
            hint="Have a referral code? Enter it to get 5 free minutes!"
          />
          <Input
            label={t('SignUp.password', 'Password')}
            isPassword
            autoComplete="new-password"
            value={form.password}
            onChange={e => update('password', e.target.value)}
            error={errors.password}
            hint={t('SignUp.passwordHint')}
            leftIcon={<Lock size={14} />}
          />
          {form.password.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                { key: 'length', label: '8+ chars' },
                { key: 'uppercase', label: 'Uppercase' },
                { key: 'lowercase', label: 'Lowercase' },
                { key: 'number', label: 'Number' },
                { key: 'special', label: 'Special char' },
              ].map(({ key, label }) => (
                <span
                  key={key}
                  className={`text-xs px-2 py-1 rounded-full ${
                    passwordChecks[key as keyof typeof passwordChecks]
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-white/40 bg-white/5'
                  }`}
                >
                  {passwordChecks[key as keyof typeof passwordChecks] ? '✓' : '○'} {label}
                </span>
              ))}
            </div>
          )}
           

          {errors.general && (
            <p className="text-sm text-error bg-error/8 border border-error/20 rounded-xl px-3 py-2">{errors.general}</p>
          )}

          <Button variant="primary"
           className='!w-full'
            fullWidth
             loading={loading}
             onClick={handleSignUp} id="signup-submit-btn">
            {form.userType === 'listener' ? 'Apply to Become a Listener →' : t('SignUp.createAccount')}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs text-white/40">🔒</span>
            <p className="text-xs text-white/40">Join 12,000+ people getting anonymous support</p>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            <span className="text-xs text-white/30">🔐 Encrypted</span>
            <span className="text-xs text-white/30">👤 Anonymous</span>
            <span className="text-xs text-white/30">🚫 Never shared</span>
          </div>
        </div>

        <p className="text-center text-sm text-white/80 mt-6">
          {t('SignUp.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">{t('SignUp.logIn')}</Link>
        </p>
      </div>
    </AuthPageFrame>
  );
};