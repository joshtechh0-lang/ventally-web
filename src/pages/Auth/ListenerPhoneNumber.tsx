import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountChangeFlow } from '../../hooks/useAccountChangeFlow';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Bell } from 'lucide-react';
import apiInstance from '../../api/apiInstance';

export const ListenerPhoneNumber = () => {
  const navigate = useNavigate();
  const { resolve } = useAccountChangeFlow();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (phone.trim()) {
      const cleaned = phone.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phoneRegex.test(cleaned)) {
        setError('Please enter a valid phone number');
        return;
      }
      try {
        setLoading(true);
        await apiInstance.put('auth/profile', { phone: phone.trim() });
      } catch (e) {
        // Continue even if save fails
      } finally {
        setLoading(false);
      }
    }
    navigate(resolve('verification'));
  };

  const handleSkip = () => {
    navigate(resolve('verification'));
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Bell size={28} className="text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Add Your Phone Number</h1>
        <p className="text-white/70 text-sm mb-4">Optional but recommended</p>

        <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-6">
          <p className="text-white/90 text-sm leading-relaxed">
            📱 We use your phone number to send you instant SMS alerts when a venter needs support. 
            This helps you respond faster and connect with more people who need help — even when 
            you're not actively checking the app.
          </p>
        </div>

        <Input
          label="Phone Number"
          placeholder="+1 234 567 8900"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(''); }}
          type="tel"
        />
        {error && <p className="text-red-400 text-sm mt-1 mb-3">{error}</p>}

        <div className="space-y-3 mt-6">
          <Button variant="primary" size="md" fullWidth onClick={handleContinue} disabled={loading}>
            {loading ? 'Saving...' : 'Continue'}
          </Button>
          <Button variant="glass" size="md" fullWidth onClick={handleSkip}>
            Skip for now
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
};
