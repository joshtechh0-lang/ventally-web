import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StripeEmbeddedCheckout } from '../../components/ui/StripeEmbeddedCheckout';
import { usePayments } from '../../api/hooks/usePayments';
import { CreditCard, Check, ArrowRight, Phone, MessageSquare, Zap } from 'lucide-react';
import type { RootState } from '../../store/store';
import { cn } from '../../utils/cn';
import { toastSuccess, toastError } from '../../utils/toast';

const TOP_UP_PACKS = [
  {
    id: 'voice_top_up',
    name: 'Voice Top-Up',
    price: 19.99,
    minutes: 15,
    messages: 0,
    description: 'Extend your call',
    icon: 'phone',
  },
  {
    id: 'text_top_up',
    name: 'Text Top-Up',
    price: 14.99,
    minutes: 0,
    messages: 50,
    description: 'Continue your conversation',
    icon: 'message',
  },
  {
    id: 'support_boost',
    name: 'Support Boost',
    price: 34.99,
    minutes: 30,
    messages: 50,
    description: 'Extra time when you need it',
    icon: 'zap',
  },
];

export const VenterAddFunds = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { createCheckoutSession } = usePayments();
    const sessionType = useSelector((state: RootState) => state.call.sessionType);

    const [selectedPack, setSelectedPack] = useState<typeof TOP_UP_PACKS[0] | null>(null);
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!selectedPack) {
            toastError('Please select a top-up pack');
            return;
        }
        setLoading(true);
        try {
            const res = await createCheckoutSession({
                packType: selectedPack.id,
                embedded: true,
            });
            if ((res as any)?.clientSecret) {
                setClientSecret((res as any).clientSecret);
            } else {
                toastError('Something went wrong. Please try again.');
            }
        } catch (e: any) {
            toastError(e?.error || e?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckoutComplete = () => {
        setClientSecret(null);
        toastSuccess('Top up successful!');
        navigate(sessionType ? '/venter/finding-listener' : '/venter/wallet', { replace: true });
    };

    const getIcon = (icon: string) => {
        if (icon === 'phone') return <Phone size={22} className="text-primary" />;
        if (icon === 'message') return <MessageSquare size={22} className="text-primary" />;
        return <Zap size={22} className="text-primary" />;
    };

    return (
        <div className="page-wrapper page-wrapper--wide animate-fade-in">
            {clientSecret && (
                <StripeEmbeddedCheckout
                    clientSecret={clientSecret}
                    onComplete={handleCheckoutComplete}
                    onClose={() => setClientSecret(null)}
                />
            )}

            <PageHeader
                title="Top Up"
                subtitle="Add more session time to continue"
                onBack={() => navigate('/venter/wallet')}
            />

            {/* Pay As You Go - TOP */}
            <div className="mb-6">
                <h3 className="text-white font-bold text-base mb-1">Pay As You Go</h3>
                <p className="text-white/60 text-sm mb-3">Save a card and get billed at $0.69/min for voice or $0.39/min for chat.</p>
                <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    leftIcon={<CreditCard size={16} />}
                    onClick={() => navigate('/signup/payment/add')}
                >
                    Manage Payment Methods
                </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-white/50 text-xs font-medium">OR</span>
                <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* One-time packs */}
            <div className="mb-4">
                <h3 className="text-white font-bold text-base mb-1">Get more time when you bundle</h3>
                <p className="text-white/60 text-sm mb-4">One-time purchase. No subscription required.</p>

                <div className="space-y-3 mb-6">
                    {TOP_UP_PACKS.map(pack => {
                        const isSelected = selectedPack?.id === pack.id;
                        return (
                            <button
                                key={pack.id}
                                onClick={() => setSelectedPack(pack)}
                                className={cn(
                                    'w-full p-4 rounded-2xl border transition-all text-left',
                                    isSelected ? 'bg-accent/10 border-accent/50' : 'glass border-white/10 hover:border-white/20'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                            {getIcon(pack.icon)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white mb-0.5">{pack.name}</p>
                                            <p className="text-sm text-white/60">
                                                {pack.minutes > 0 && pack.messages > 0
                                                    ? `${pack.minutes} minutes + ${pack.messages} messages`
                                                    : pack.minutes > 0
                                                    ? `${pack.minutes} minutes`
                                                    : `${pack.messages} messages`}
                                            </p>
                                            <p className="text-xs text-white/40">{pack.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-bold text-accent">${pack.price.toFixed(2)}</p>
                                        <div className={cn(
                                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                            isSelected ? 'border-accent bg-accent' : 'border-white/30'
                                        )}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <Button
                    variant="glass"
                    fullWidth
                    loading={loading}
                    disabled={!selectedPack || loading}
                    rightIcon={<ArrowRight size={18} />}
                    onClick={handleConfirm}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
