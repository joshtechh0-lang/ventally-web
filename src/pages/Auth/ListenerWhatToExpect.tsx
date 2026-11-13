import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { useAccountChangeFlow } from '../../hooks/useAccountChangeFlow';

const STEPS = [
  { number: '①', label: 'Register & verify email', time: '3 min' },
  { number: '②', label: 'Complete your profile', time: '5 min' },
  { number: '③', label: 'Sign agreements', time: '2 min' },
  { number: '④', label: 'Complete training modules', time: '2 hrs' },
  { number: '⑤', label: 'Submit for review', time: '1 min' },
  { number: '⑥', label: 'Get approved & go live', time: '24–48h' },
];

const HOW_IT_WORKS = [
  {
    icon: '📲',
    title: 'You receive incoming call requests',
    body: 'When a user wants to connect, you get a notification. You choose to accept or decline — calls are never assigned without your consent. Toggle your availability status anytime.',
  },
  {
    icon: '⏱️',
    title: 'Sessions run as long as the user needs',
    body: 'There\'s no fixed session length. You earn per minute for every active minute on the call. Longer sessions = more earnings.',
  },
  {
    icon: '💰',
    title: 'Weekly payouts via Stripe',
    body: 'Your earnings accumulate per session and are paid out weekly directly to your bank account via Stripe. Track your earnings and payout history in your dashboard.',
  },
  {
    icon: '🌐',
    title: 'Affiliate & referral bonuses',
    body: 'Share your unique affiliate link with other potential Support Guides. When someone signs up through your link and gets approved, you earn a referral bonus. Track all referrals in your dashboard.',
  },
  {
    icon: '🛡️',
    title: 'You\'re protected',
    body: 'All users agree to community guidelines before they can call. If a user behaves inappropriately, you can end the call and report them instantly — with zero risk to your standing.',
  },
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
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '10px' }}>
          Become a Support Guide
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', lineHeight: '1.6', marginBottom: '6px' }}>
          Help others. Earn. Make a difference.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', opacity: 0.7 }}>
          Setup takes ~10 minutes + 24–48h approval
        </p>
      </div>

      {/* Benefits */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        {[
          { icon: '💰', label: 'Weekly payouts' },
          { icon: '🕐', label: 'Flexible hours' },
          { icon: '🌍', label: 'Work remotely' },
        ].map((b) => (
          <div key={b.label} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{b.icon}</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', margin: 0 }}>{b.label}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '14px' }}>
          How it works
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.icon}
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '14px 16px',
                borderWidth: '0.5px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-pure)' }}>{item.title}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '24px' }} />

      {/* Application steps */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-pure)', marginBottom: '14px' }}>
          Application process
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
          📋 <strong>Approval timeline:</strong> After submitting, our team reviews your application within <strong>24–48 hours</strong>. You'll receive an email with your approval status. No formal experience required — just empathy, reliability, and completing the training.
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
