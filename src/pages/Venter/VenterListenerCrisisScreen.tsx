import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, PhoneCall, MessageSquare } from 'lucide-react';

export const VenterListenerCrisisScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCall988 = () => {
    window.location.href = 'tel:988';
    setTimeout(() => navigate('/venter/home', { replace: true }), 1000);
  };

  const handleText988 = () => {
    window.location.href = 'sms:988';
    setTimeout(() => navigate('/venter/home', { replace: true }), 1000);
  };

  const handleImSafe = () => {
    navigate('/venter/home', { replace: true });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div className="glass w-full max-w-sm rounded-3xl p-8 text-center border border-white/10">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={30} className="text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">
          {t('Crisis.venterOverlayTitle', 'Ventally is not a crisis service.')}
        </h3>
        <p className="text-sm text-white/70 leading-relaxed mb-8">
          {t('Crisis.venterOverlayMessage', 'If you are thinking about self harm, suicide, or feel unsafe, please contact 988 or emergency services now.')}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCall988}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <PhoneCall size={20} />
            {t('Crisis.call988Now', 'CALL 988 NOW')}
          </button>
          <button
            onClick={handleText988}
            className="w-full py-4 rounded-2xl border border-white/20 text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <MessageSquare size={20} />
            {t('Crisis.text988', 'TEXT 988')}
          </button>
          <button
            onClick={handleImSafe}
            className="w-full py-3 text-white/50 text-sm hover:text-white/80 transition-colors"
          >
            {t('Crisis.imSafeReturn', "I'm Safe - Return to Ventally")}
          </button>
        </div>
      </div>
    </div>
  );
};
