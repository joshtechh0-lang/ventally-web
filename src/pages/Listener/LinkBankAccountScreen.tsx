import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Building } from 'lucide-react';
import apiInstance from '../../api/apiInstance';
import { toastError } from '../../utils/toast';

const STRIPE_SUPPORTED_COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

export const LinkBankAccountScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('');

  const handleContinue = async () => {
    if (!country) {
      toastError('Please select your country');
      return;
    }
    setLoading(true);
    try {
      const res = await apiInstance.post('earnings/bank-account/link', {
        platform: 'web',
        country,
        returnUrl: `${window.location.origin}/listener/payout`,
        refreshUrl: `${window.location.origin}/listener/bank-account`,
      });
      const url = res.data?.bankLink?.onboardingUrl;
      if (url) {
        window.location.href = url;
      } else {
        toastError('Could not get onboarding link. Please try again.');
      }
    } catch (e: any) {
      toastError(e?.response?.data?.message || e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper animate-fade-in flex flex-col items-center justify-center min-h-[80vh]">
      <PageHeader title="" onBack={() => navigate(-1)} />
      <div className="w-full max-w-sm">
        <GlassCard bordered className="flex flex-col items-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <Building size={32} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            {t('Listener.linkBank.title', 'Link Bank Account')}
          </h2>
          <p className="text-sm text-white/60 mb-6">Select your country to set up your payout account.</p>

          <div className="w-full mb-6">
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary"
              style={{ appearance: 'none' }}
            >
              <option value="" style={{ background: '#1a1a2e' }}>Select your country...</option>
              {STRIPE_SUPPORTED_COUNTRIES.map(c => (
                <option key={c.code} value={c.code} style={{ background: '#1a1a2e' }}>{c.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            fullWidth
            loading={loading}
            disabled={!country}
            onClick={handleContinue}
            className="h-14 rounded-full font-semibold mb-4"
          >
            {t('Common.continue', 'Continue')}
          </Button>

          <p className="text-xs text-white/40 leading-relaxed">
            {t('Listener.linkBank.footer', 'You will be redirected to Stripe to securely link your bank account. This process is encrypted and safe.')}
          </p>
        </GlassCard>

        <p className="text-xs text-white/30 text-center mt-4">
          If your country is not listed, Stripe payouts are not yet available in your region.
        </p>
      </div>
    </div>
  );
};
