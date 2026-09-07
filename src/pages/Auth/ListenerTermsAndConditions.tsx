import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ArrowLeft, Check } from 'lucide-react';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { useAccountChangeFlow } from '../../hooks/useAccountChangeFlow';

const TERM_SUMMARIES = [
  { id: 'liability', icon: '🔒', labelKey: 'ListenerTermsAndConditions.liabilityWaiver', summary: 'You participate voluntarily as a peer support provider, not a clinician.' },
  { id: 'payment', icon: '💰', labelKey: 'ListenerTermsAndConditions.paymentTerms', summary: 'Earnings are processed weekly. Minimum session threshold applies.' },
  { id: 'agreement', icon: '🔒', labelKey: 'ListenerTermsAndConditions.listenerAgreement', summary: 'All user conversations are strictly confidential.' },
  { id: 'nda', icon: '🔒', labelKey: 'ListenerTermsAndConditions.nda', summary: 'You agree not to disclose any user information outside the platform.' },
  { id: 'conduct', icon: '📋', labelKey: 'ListenerTermsAndConditions.codeOfConduct', summary: 'Maintain empathy, professionalism and boundaries at all times.' },
] as const;

type TermId = (typeof TERM_SUMMARIES)[number]['id'];

export const ListenerTermsAndConditions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAccountChanging, resolve } = useAccountChangeFlow();
  const legacyAccountTypeChanging = (location.state as any)?.accountTypeChanging;
  const effectiveChanging = isAccountChanging || legacyAccountTypeChanging;

  const [allAgreed, setAllAgreed] = useState(false);
  const allChecked = allAgreed;

  const handleContinue = () => {
    if (!allChecked) {
      toast.error(t('Common.pleaseCompleteAllFields', 'Please accept all terms before continuing'));
      return;
    }
    navigate(resolve('verification'), {
      state: effectiveChanging ? { accountTypeChanging: true } : undefined,
    });
  };

  const content = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Progress indicator */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Step 4 of 5 — Legal Agreement</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Almost done!</span>
        </div>
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', height: '4px' }}>
          <div style={{ width: '80%', background: 'var(--primary)', borderRadius: '100px', height: '4px' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-pure)' }}>
          {t('ListenerTermsAndConditions.title')}
        </h1>
      </div>

      {/* Summary Cards */}
      <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {TERM_SUMMARIES.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              {item.icon} {t(item.labelKey)}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>
              {item.summary}
            </p>
          </div>
        ))}
      </div>

      {/* Single agreement checkbox */}
      <button
        type="button"
        onClick={() => setAllAgreed(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: '12px',
          padding: '14px',
          cursor: 'pointer',
          textAlign: 'left',
          marginBottom: '24px',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            border: `2px solid ${allAgreed ? '#ffffff' : 'rgba(255,255,255,0.4)'}`,
            background: allAgreed ? '#ffffff' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {allAgreed && <Check size={12} color="#000000" strokeWidth={3} />}
        </span>
        <span style={{ flex: 1, color: 'rgba(255,255,255,0.95)', fontSize: '13px' }}>
          I have read and agree to all Ventally Support Guide terms & policies.
        </span>
      </button>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleContinue}
      >
        {t('ListenerTermsAndConditions.continue', 'Continue')}
      </Button>
    </>
  );

  if (effectiveChanging) {
    return <div className="page-wrapper page-wrapper--wide animate-fade-in">{content}</div>;
  }
  return <AuthLayout>{content}</AuthLayout>;
};
