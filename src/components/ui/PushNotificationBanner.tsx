import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { useWebNotifications } from '../../api/hooks/useWebNotifications';

/** Shown when push permission is not granted — requires a user click (iOS Safari). */
export const PushNotificationBanner = () => {
  const { t } = useTranslation();
  const { permission, isLoading, requestPermission } = useWebNotifications({ autoRequest: false });

  if (permission === 'unsupported' || permission === 'granted') {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/15 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
          <Bell size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            {t('NotificationsSettings.enablePush', 'Enable Push Notifications')}
          </p>
          <p className="text-xs text-white/70 mt-0.5">
            {permission === 'denied'
              ? t(
                  'NotificationsSettings.enablePushBlocked',
                  'Notifications are blocked. Enable them in your browser settings, then tap Enable.'
                )
              : t(
                  'NotificationsSettings.enablePushDesc',
                  'Allow Ventally to send alerts to this device.'
                )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => requestPermission()}
        disabled={isLoading}
        className="px-4 py-2 bg-primary hover:bg-primary-hover transition-colors text-white text-xs font-bold rounded-lg whitespace-nowrap disabled:opacity-60"
      >
        {isLoading ? t('Common.loading', 'Loading...') : t('Common.enable', 'Enable')}
      </button>
    </div>
  );
};
