import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { useSelector } from 'react-redux';
import { ArrowLeft, Check } from 'lucide-react';

export const OptionalQuestionsHero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.user.user);
  const role = user?.role || user?.userType || 'venter';

  const handleSkipAll = () => {
    if (role === 'listener') {
      navigate('/signup/listener-training');
    } else {
      navigate('/venter/home');
    }
  };

  return (
    <AuthLayout>
      <button 
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-pure)', marginBottom: '16px' }}>
          {t('OptionalQuestions.title')}
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '15px', lineHeight: '1.6' }}>
          {t('OptionalQuestions.introText')}
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '12px', opacity: 0.7 }}>
          4 quick questions — about 60 seconds
        </p>
        <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
            🎯 <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Why we ask:</strong> Ventally matches you with Support Guides who understand your background, values, and lived experience. Your answers help us make that match — nothing is shared with other users.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>
          Help us match you with a Support Guide who gets it
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((num) => (
            <div key={num} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div
                className="flex items-center justify-center flex-shrink-0 bg-primary rounded-full mt-0.5"
                style={{ width: '24px', height: '24px' }}
              >
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.4' }}>
                {t(`OptionalQuestions.bullet${num}`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Button
        className='!w-full'
          variant="primary"
 
          fullWidth
          onClick={() => navigate('/signup/questions/gender')}
        >
          {t('OptionalQuestions.continue')}
        </Button>
        <Button
        className='!w-full'
 
          fullWidth
          onClick={handleSkipAll}
        >
          {t('OptionalQuestions.skipAll')}
        </Button>
      </div>
    </AuthLayout>
  );
};
