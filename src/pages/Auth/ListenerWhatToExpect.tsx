import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { useAccountChangeFlow } from '../../hooks/useAccountChangeFlow';

const STEPS = [
  { number: '①', label: 'Register', time: '2 min' },
  { number: '②', label: 'Verify email', time: '1 min' },
  { number: '③', label: 'Complete your profile', time: '5 min' },
  { number: '④', label: 'Sign agreements', time: '2 min' },
  { number: '⑤', label: 'Complete training', time: '2 hrs' },
  { number: '⑥', label: 'Submit for review', time: '1 min' },
  { number: '⑦', label: 'Get approved', time: '24–48h' },
];

export const ListenerWhatToExpect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccountChanging } = useAccountChangeFlow();
  const legacyAccountTypeChanging = (location.state as any)?.accountTypeChanging;
  const effectiveChanging = isAccountChanging || legacyAccountTypeChanging;

  const handleContinue = () => {
    navigate('/signup', { state: { userType: 'listener' } });
  };

  const content = (
    <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '12px' }}>
          Become a Support Guide
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', lineHeight: '1.6' }}>
          Help others. Earn. Make a difference.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>
          Setup takes ~10 minutes + 24–48h approval
        </p>
      </div>

      {/* Benefits */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { icon: '💰', label: 'Earn per session' },
          { icon: '🕐', label: 'Flexible hours' },
          { icon: '🌍', label: 'Work remotely' },
        ].map((b) => (
          <div key={b.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{b.icon}</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{b.label}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '16px' }}>
          Application process:
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {STEPS.map((step) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '12px 16px',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{step.number}</span>
              <span style={{ flex: 1, color: 'var(--text-pure)', fontSize: '14px' }}>{step.label}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '12px', flexShrink: 0 }}>{step.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Approval info */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
          📋 <strong>Approval timeline:</strong> After submitting your ID verification, our team reviews your application within <strong>24–48 hours</strong>. You'll receive an email with your approval status. No experience required — just empathy and reliability.
        </p>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
        Apply to Become a Support Guide →
      </Button>
    </div>
  );

  if (effectiveChanging) {
    return <div className="page-wrapper page-wrapper--wide animate-fade-in">{content}</div>;
  }
  return <AuthLayout>{content}</AuthLayout>;
};
