import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../../components/Layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import apiInstance from '../../api/apiInstance';
import { useAccountChangeFlow } from '../../hooks/useAccountChangeFlow';
import { toastSuccess, toastError } from '../../utils/toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RbvtaQox8EzFo8CWxU5uMUCrgdi2czKA4Mk1pp5gJw7k571P4yKjkmiDS8U1YjoEubIrSYemE4MYPxA69Lwg3seO0NLxEXNIL');

const cardStyle = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: 'rgba(255,255,255,0.4)' },
    },
    invalid: { color: '#ff6b6b' },
  },
};

const PaymentForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'card' | 'wallet'>('card');

  useEffect(() => {
    if (!stripe) return;
    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: { label: 'Save payment method', amount: 0 },
      requestPayerName: true,
      requestPayerEmail: true,
    });
    pr.canMakePayment().then(result => {
      if (result) setPaymentRequest(pr);
    });
  }, [stripe]);

  const handleCardSave = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const res: any = await apiInstance.post('payments/payg-setup-intent', {});
      const clientSecret = res?.clientSecret || res?.data?.clientSecret;
      if (!clientSecret) throw new Error('Failed to create setup intent');

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) throw new Error(error.message);
      toastSuccess('Card saved successfully!');
      onSuccess();
    } catch (e: any) {
      toastError(e?.message || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('card')}
          className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
            activeTab === 'card' ? 'bg-primary text-white' : 'glass text-white/60'
          }`}
        >
          <CreditCard size={18} /> Credit/Debit Card
        </button>
        {paymentRequest && (
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
              activeTab === 'wallet' ? 'bg-primary text-white' : 'glass text-white/60'
            }`}
          >
            <Smartphone size={18} /> Google/Apple Pay
          </button>
        )}
      </div>

      {activeTab === 'card' && (
        <div>
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
            <CardElement options={cardStyle} />
          </div>
          <Button
            variant="primary"
            fullWidth
            loading={loading}
            onClick={handleCardSave}
          >
            Save Card
          </Button>
        </div>
      )}

      {activeTab === 'wallet' && paymentRequest && (
        <div className="mt-4">
          <PaymentRequestButtonElement
            options={{ paymentRequest }}
          />
        </div>
      )}
    </div>
  );
};

export const AddPaymentMethodScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAccountChanging, resolve } = useAccountChangeFlow();

  const handleSuccess = () => {
    navigate(resolve('payment/saved'));
  };

  const content = (
    <>
      <button
        onClick={() => navigate(-1)}
        className="text-white/80 hover:text-white flex items-center gap-2 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> {t('Common.back', 'Back')}
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">{t('Payment.addMethod', 'Add Payment Method')}</h1>
        <p className="text-sm text-white/80">{t('Payment.secureInfo', 'Your payment information is strictly confidential and secure.')}</p>
      </div>

      <Elements stripe={stripePromise}>
        <PaymentForm onSuccess={handleSuccess} />
      </Elements>
    </>
  );

  if (isAccountChanging) {
    return <div className="page-wrapper page-wrapper--wide animate-fade-in">{content}</div>;
  }
  return <AuthLayout>{content}</AuthLayout>;
};
