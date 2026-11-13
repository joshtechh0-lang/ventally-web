import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, MessageSquare, ChevronRight, Bell, Gift } from 'lucide-react';
import type { RootState } from '../../store/store';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { MoodSelector, type MoodType } from '../../components/ui/MoodSelector';
import { EmptyState } from '../../components/ui/EmptyState';
import { useMood } from '../../api/hooks/useMood';
import { useReflections } from '../../api/hooks/useReflections';
import { MoodBarChart } from '../../components/charts/MoodBarChart';
import happyIcon from '../../assets/icons/happy.png';
import { AppBrandIcon } from '../../components/ui/AppBrandIcon';
import { getUnreadNotificationCount } from '../../api/notificationsApi';
import apiInstance from '../../api/apiInstance';
import { useWallet } from '../../api/hooks/useWallet';
import i18n from '../../locales/i18n';

export const VenterDashboard = () => {
  const { t } = useTranslation();
  const { getWallet, getMySubscription } = useWallet();
  const [balance, setBalance] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [showNoPaymentModal, setShowNoPaymentModal] = useState(false);
  const [showLowBalanceModal, setShowLowBalanceModal] = useState(false);
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user.user as any);
  const { getTodayMood, getMoodStats } = useMood();
  const { getTodayReflection, getReflectionHistory } = useReflections();

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [happyDays, setHappyDays] = useState(0);
  const [reflection, setReflection] = useState<any>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineListeners, setOnlineListeners] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const daysInMonth = new Date().getDate();
        const [moodRes, statsRes, reflectionRes, historyRes, unreadRes] = await Promise.allSettled([
          getTodayMood(),
          getMoodStats(daysInMonth),
          getTodayReflection(),
          getReflectionHistory(3, 0),
          getUnreadNotificationCount(),
        ]);

        if (moodRes.status === 'fulfilled' && moodRes.value?.mood) {
          const mood = moodRes.value.mood;
          setTodayMood(mood);
          const today = new Date().toLocaleDateString();
          if (new Date(mood.updated_at).toLocaleDateString() === today) {
            setSelectedMood(mood.mood_type?.toLowerCase() as MoodType);
          }
        }

        if (statsRes.status === 'fulfilled' && statsRes.value?.mood_distribution) {
          const allMoods = ['happy', 'neutral', 'sad', 'anxious', 'mad'] as const;
          const moodMap: Record<string, number> = {};
          statsRes.value.mood_distribution.forEach((d: any) => {
            if (d.mood_type) moodMap[d.mood_type.toLowerCase()] = parseInt(d.count, 10);
          });
          const mapped = allMoods.map(m => ({ value: moodMap[m] || 0, label: m }));
          setChartData(mapped);
          setHappyDays(moodMap['happy'] || 0);
        }

        if (reflectionRes.status === 'fulfilled' && reflectionRes.value?.saved) {
          const r = reflectionRes.value.reflection;
          const today = new Date().toLocaleDateString();
          if (r && new Date(r.updated_at).toLocaleDateString() === today) {
            setReflection(r);
          }
        }

        if (historyRes.status === 'fulfilled' && historyRes.value?.reflections) {
          setReflections(historyRes.value.reflections);
        }

        if (unreadRes.status === 'fulfilled') {
          const count = (unreadRes.value as any)?.data?.unreadCount ?? 0;
          setUnreadCount(count);
        }

        // Fetch online listener count
        try {
          const listenersRes = await apiInstance.get('availability/listeners');
          const count = (listenersRes as any)?.data?.count ?? (listenersRes as any)?.data?.listeners?.length ?? 0;
          setOnlineListeners(count);
        } catch {
          setOnlineListeners(0);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch wallet balance and subscription on mount
  useEffect(() => {
    getWallet().then((res: any) => {
      const balanceData = res?.balance ?? res?.data?.balance ?? null;
      setBalance(balanceData);
      const minutes = balanceData?.minutes ?? 0;
      if (minutes < 5 && minutes > 0) {
        setShowLowBalanceModal(true);
      }
    }).catch(() => {});
    getMySubscription().then((res: any) => {
      setSubscription(res?.subscription ?? res?.data?.subscription ?? null);
    }).catch(() => {});
  }, []);

  // Fetch online listener count and poll every 30 seconds
  useEffect(() => {
    const fetchListeners = () => {
      apiInstance.get('availability/listeners')
        .then((res: any) => {
          const count = res?.data?.count ?? res?.data?.listeners?.length ?? 0;
          setOnlineListeners(count);
        })
        .catch(() => setOnlineListeners(0));
    };
    fetchListeners();
    const interval = setInterval(fetchListeners, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    localStorage.setItem('hasCheckedInMood', 'true');
    if (todayMood) {
      navigate('/venter/mood/log', {
        state: {
          editMode: true,
          selectedMood: mood,
          item: {
            mood: todayMood.mood_type,
            note: todayMood.notes,
            categories: todayMood.category ? [todayMood.category.toLowerCase()] : [],
          },
        },
      });
    } else {
      navigate('/venter/mood/log', { state: { selectedMood: mood } });
    }
  };

  const handleCall = () => {
    navigate('/venter/finding-listener', { state: { type: 'call' } });
  };

  const handleChat = () => {
    navigate('/venter/finding-listener', { state: { type: 'chat' } });
  };

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <div className="w-full lg:max-w-5xl xl:max-w-6xl lg:mx-auto">
        {/* Header — desktop only; mobile uses layout top bar */}
        <div className="hidden lg:flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-2 lg:gap-3">
            <AppBrandIcon className="w-9 h-9 rounded-[0.65rem] sm:w-10 sm:h-10 sm:rounded-2xl" />
            <span className="text-lg lg:text-xl font-bold text-white tracking-tight">
              {t('Home.title')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/venter/notifications')}
            className="w-10 h-10 glass rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-colors relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary" />
            )}
          </button>
        </div>

        {/* Mobile: single column (unchanged order). Desktop: actions | insights */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-10 lg:items-start">
          <div className="min-w-0 space-y-6">
            {/* Guided first action for new users */}
            {!selectedMood && !reflection && reflections.length === 0 && !loading && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-2">
                <p className="text-sm font-semibold text-white mb-1">Welcome! Start here</p>
                <p className="text-xs text-white/60 mb-3">Log your first mood to begin tracking your wellbeing journey.</p>
                <div className="text-xs text-white/40">↓ Select how you're feeling below</div>
              </div>
            )}

            {/* Your Reflection Button */}
            <Button
              variant="glass"
              size="md"
              fullWidth
              onClick={() => {
                if (reflection) {
                  navigate(`/venter/reflections/${reflection.id}`, { state: { reflection } });
                } else {
                  navigate('/venter/reflections/add');
                }
              }}
              className="!mb-0"
            >
              {t('VenterHome.yourReflection')}
            </Button>

            {/* Start a Session — 3 states: subscriber / PAYG / ad user */}
            <div>
              <div className="flex items-center justify-between mb-3 lg:mb-3.5">
                <p className="text-sm font-semibold text-white">Start a session</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/60">Support available 24/7</span>
                </div>
              </div>

              {/* Subscriber state */}
              {subscription?.status === 'active' && (() => {
                const memberMinutes = balance?.member_minutes ?? balance?.minutes ?? 0;
                const rolloverMinutes = balance?.rollover_minutes ?? 0;
                const totalMinutes = Math.floor(memberMinutes + rolloverMinutes);
                const nextRefill = subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
                  : null;
                return (
                  <div className="space-y-3">
                    {/* Member minutes breakdown */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-2xl">⏱</div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-white">
                          {loading ? '—' : `${totalMinutes} minutes available`}
                        </p>
                        {!loading && (rolloverMinutes > 0 ? (
                          <p className="text-xs text-white/50">
                            {memberMinutes} new this month + {rolloverMinutes} rolled over
                          </p>
                        ) : (
                          <p className="text-xs text-white/50">Member minutes · renews {nextRefill ?? 'soon'}</p>
                        ))}
                        {!loading && totalMinutes === 0 && nextRefill && (
                          <p className="text-xs text-amber-400/80 mt-0.5">Next refill {nextRefill} · pay-as-you-go available</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="glass" fullWidth onClick={handleCall} className="justify-center !w-full text-xs sm:text-sm">
                        📞 Start voice
                      </Button>
                      <Button variant="glass" fullWidth onClick={handleChat} className="justify-center !w-full text-xs sm:text-sm">
                        💬 Start chat
                      </Button>
                    </div>
                    <p className="text-xs text-white/35 text-center">Uses your member minutes</p>
                  </div>
                );
              })()}

              {/* PAYG state (no active sub, has balance or payment method) */}
              {(!subscription || subscription?.status !== 'active') && ((balance?.currency ?? 0) > 0 || balance?.hasPaymentMethod) && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCall}
                      className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-xl">📞</span>
                      <span className="text-sm font-semibold text-white">Start voice</span>
                      <span className="text-xs text-white/50">$0.69/min</span>
                    </button>
                    <button
                      onClick={handleChat}
                      className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-xl">💬</span>
                      <span className="text-sm font-semibold text-white">Start chat</span>
                      <span className="text-xs text-white/50">$0.39/min</span>
                    </button>
                  </div>
                  {/* Ad reward if available */}
                  {(balance?.ad_minutes ?? 0) > 0 && (
                    <button
                      onClick={handleCall}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-green-500/10 border border-green-500/25 hover:bg-green-500/15 transition-colors"
                    >
                      <span className="text-lg">🎁</span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-green-300">Use your reward</p>
                        <p className="text-xs text-white/50">{balance.ad_minutes} free minutes earned</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Ad user state (no sub, no balance, no payment method) */}
              {(!subscription || subscription?.status !== 'active') && !((balance?.currency ?? 0) > 0 || balance?.hasPaymentMethod) && (
                <div className="space-y-3">
                  {/* Try for free banner */}
                  <button
                    onClick={() => navigate('/venter/wallet/add-funds')}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl glass border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">▶</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">Try 5 minutes free</p>
                      <p className="text-xs text-white/50">Watch 3 ads to unlock your first session</p>
                    </div>
                    <span className="text-white/30 text-lg">›</span>
                  </button>
                  {/* PAYG options below */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCall}
                      className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl glass border border-white/8 hover:bg-white/8 transition-colors"
                    >
                      <span className="text-lg">📞</span>
                      <span className="text-xs font-semibold text-white">Start voice</span>
                      <span className="text-xs text-white/40">$0.69/min</span>
                    </button>
                    <button
                      onClick={handleChat}
                      className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl glass border border-white/8 hover:bg-white/8 transition-colors"
                    >
                      <span className="text-lg">💬</span>
                      <span className="text-xs font-semibold text-white">Start chat</span>
                      <span className="text-xs text-white/40">$0.39/min</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mood Check In */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 lg:mb-3.5">{t('VenterHome.moodCheckIn')}</p>
              <MoodSelector
                selected={selectedMood}
                onSelect={handleMoodSelect}
                disabled={loading}
              />
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            {/* Reflections Section */}
            <div>
              <div className="flex items-center justify-between mb-3 lg:mb-3.5">
                <p className="text-sm font-semibold text-white">{t('VenterHome.reflections')}</p>
              </div>

              {loading ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 lg:grid lg:grid-cols-1 min-[1100px]:grid-cols-2 lg:overflow-visible lg:pb-0">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton flex-shrink-0 w-56 min-[1100px]:min-w-0 lg:w-full h-24 rounded-2xl" />
                  ))}
                </div>
              ) : reflections.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 lg:grid lg:grid-cols-1 min-[1100px]:grid-cols-2 lg:overflow-visible lg:pb-0">
                  {reflections.map((r: any) => (
                    <GlassCard
                      key={r.id}
                      hover
                      bordered
                      onClick={() => navigate(`/venter/reflections/${r.id}`, { state: { reflection: r } })}
                      className="flex-shrink-0 w-56 min-[1100px]:min-w-0 lg:w-full cursor-pointer"
                      padding="sm"
                      rounded="2xl"
                    >
                      <p className="text-sm text-white font-medium line-clamp-2 mb-2">{r.reflection_text}</p>
                      <p className="text-xs text-white/80">
                        {new Date(r.reflection_date).toLocaleDateString(i18n.language, { month: 'long', day: 'numeric' })}
                      </p>
                      <div className="flex justify-end mt-1">
                        <ChevronRight size={14} className="text-white" />
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="What's on your mind today?"
                  description="Take a moment to capture your thoughts — what brought you here today?"
                  icon={<MessageSquare size={22} />}
                />
              )}

              {/* Your Wallet card */}
              <GlassCard bordered className="mt-3" onClick={() => navigate('/venter/wallet')} hover>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">Your Wallet</p>
                  <span className="text-xs text-primary cursor-pointer">View →</span>
                </div>
                {loading ? (
                  <div className="skeleton h-8 rounded-xl" />
                ) : subscription?.status === 'active' ? (
                  <div className="space-y-1">
                    {((balance?.member_minutes ?? balance?.minutes ?? 0) + (balance?.rollover_minutes ?? 0)) > 0 ? (
                      <>
                        <p className="text-sm text-white">⏱ <span className="font-semibold">{Math.floor((balance?.member_minutes ?? balance?.minutes ?? 0) + (balance?.rollover_minutes ?? 0))}</span> member minutes</p>
                        {(balance?.rollover_minutes ?? 0) > 0 && (
                          <p className="text-xs text-white/50 pl-5">🔄 {balance.rollover_minutes} rolled over from last month</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-white/60">No minutes remaining · refills soon</p>
                    )}
                    {(balance?.referral_credits ?? 0) > 0 && (
                      <p className="text-sm text-white">🎁 <span className="font-semibold">${Number(balance.referral_credits).toFixed(2)}</span> referral credits</p>
                    )}
                  </div>
                ) : (balance?.currency ?? 0) > 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm text-white">💳 <span className="font-semibold">${Number(balance.currency).toFixed(2)}</span> available</p>
                    {(balance?.referral_credits ?? 0) > 0 && (
                      <p className="text-sm text-white">🎁 <span className="font-semibold">${Number(balance.referral_credits).toFixed(2)}</span> referral credits</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/60">No funds · add to start a session</p>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/venter/wallet/add-funds'); }}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-hover transition-colors text-white text-xs font-semibold rounded-lg"
                    >
                      Add funds
                    </button>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Refer & Earn Card */}
            <GlassCard hover onClick={() => navigate('/venter/referral')} className="cursor-pointer mt-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Gift size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Refer & Earn</p>
                  <p className="text-xs text-white/50">Give $5, get $5 · share your code</p>
                </div>
                <ChevronRight size={16} className="text-white/30" />
              </div>
            </GlassCard>

            {/* Mood Chart Section */}
            {chartData.length > 0 && (
              <GlassCard style={{ background: 'rgba(0,0,0,0.15)' }}>
                <p className="text-sm font-medium text-white mb-6">{t('VenterHome.moodOverTime')}</p>
                <MoodBarChart data={chartData} />
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Low Wallet Modal */}
      {showNoPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full text-center">
            <h2 className="text-white text-xl font-bold mb-2">Payment Method Required</h2>
            <p className="text-white/70 text-sm mb-6">You need a saved payment method to start a voice session. Add a card to continue.</p>
            <div className="space-y-3">
              <button
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
                onClick={() => { setShowNoPaymentModal(false); navigate('/signup/payment/add'); }}
              >
                Add Card
              </button>
              <button
                className="w-full py-3 rounded-xl text-white/50 text-sm"
                onClick={() => setShowNoPaymentModal(false)}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
      {showLowBalanceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="glass rounded-2xl p-6 max-w-sm w-full text-center">
            <h2 className="text-white text-xl font-bold mb-2">Low Wallet</h2>
            <p className="text-white/70 text-sm mb-6">You need minutes to start a session. Top up your balance to continue.</p>
            <div className="space-y-3">
              <button
                className="w-full py-3 rounded-xl bg-primary text-white font-semibold"
                onClick={async () => {
                  setShowLowBalanceModal(false);
                  try {
                    const sub = await getMySubscription();
                    const hasSub = sub?.hasSubscription;
                    navigate('/venter/wallet/add-funds');
                  } catch {
                    navigate('/venter/wallet/add-funds');
                  }
                }}
              >
                Add Funds
              </button>

              <button
                className="w-full py-3 rounded-xl text-white/50 text-sm"
                onClick={() => setShowLowBalanceModal(false)}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
