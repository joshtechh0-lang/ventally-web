import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Phone, MessageSquare, PhoneOff, PhoneIncoming } from 'lucide-react';
import apiInstance from '../../api/apiInstance';
import { sessionStarted, chatSessionStarted } from '../../store/slices/callSlice';
import { setSessionInfo } from '../../store/slices/sessionSlice';
import { toastError } from '../../utils/toast';
import { useMicPermission } from '../../hooks/useMicPermission';
import { MainBackground } from '../../components/ui/MainBackground';

type RequestStatus = 'loading' | 'ready' | 'not_found' | 'expired';

export const IncomingRequestScreen = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { ensureMicPermission, MicPermissionModal } = useMicPermission();

  const requestId = searchParams.get('requestId');
  const requestType = searchParams.get('type') as 'call' | 'chat' | null; // 'call' or 'chat'

  const [status, setStatus] = useState<RequestStatus>('loading');
  const [requestData, setRequestData] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!requestId) {
      setStatus('not_found');
      return;
    }

    const fetchRequest = async () => {
      try {
        const endpoint = requestType === 'chat' ? `conversations/${requestId}` : `calls/${requestId}`;
        const res = await apiInstance.get(endpoint);
        const data = res.data?.call ?? res.data?.conversation ?? res.data;

        if (!data) { setStatus('not_found'); return; }

        if (data.status === 'requesting' || data.status === 'pending') {
          setRequestData(data);
          setStatus('ready');
        } else {
          // Already accepted, cancelled, or expired
          setStatus('expired');
        }
      } catch {
        setStatus('not_found');
      }
    };

    fetchRequest();
  }, [requestId, requestType]);

  const handleAccept = async () => {
    if (requestType === 'call') {
      const micGranted = await ensureMicPermission();
      if (!micGranted) return;
    }
    setAccepting(true);
    try {
      if (requestType === 'call') {
        const res = await apiInstance.post(`calls/${requestId}/accept`);
        const call = res.data?.call ?? res.data;
        const roomId = call?.channelName || res.data?.roomId || requestId;

        dispatch(sessionStarted({ sessionId: requestId! }));
        dispatch(setSessionInfo({
          sessionId: requestId ?? null,
          requestId: requestId ?? null,
          venterId: requestData?.venterId ?? requestData?.venter?.id ?? null,
          listenerId: requestData?.listenerId ?? requestData?.listener?.id ?? null,
          sessionType: 'call',
          data: { ...requestData, ...res.data },
        }));

        navigate(`/listener/call/${roomId}`, {
          replace: true,
          state: {
            call: {
              ...call,
              token: call?.token,
              channelName: call?.channelName,
              roomName: call?.channelName,
              uid: call?.uid ?? call?.agoraUid ?? 2,
            },
          },
        });
      } else {
        // Chat
        const res = await apiInstance.post(`conversations/${requestId}/accept`);
        const chatData = res.data;
        const conversationId =
          chatData?.conversationId || chatData?.conversation?.id || chatData?.id || requestId;

        dispatch(chatSessionStarted({ chatData, chatStartTime: Date.now(), conversationId }));
        dispatch(setSessionInfo({
          sessionId: conversationId ?? null,
          requestId: requestId ?? null,
          venterId: requestData?.venterId ?? chatData?.conversation?.venterId ?? null,
          listenerId: requestData?.listenerId ?? chatData?.listenerId ?? chatData?.listener?.id ?? null,
          sessionType: 'chat',
          data: chatData,
        }));

        navigate(`/listener/chat/${conversationId}`, { replace: true, state: { chat: chatData } });
      }
    } catch (e: any) {
      toastError(e?.error || t('Common.somethingWentWrong'));
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      if (requestType === 'call') {
        await apiInstance.post(`calls/${requestId}/decline`);
      } else {
        await apiInstance.post(`conversations/${requestId}/decline`);
      }
    } catch {
      // Swallow — still navigate away
    }
    navigate('/listener/home', { replace: true });
  };

  const venterName =
    requestData?.requester?.anonymousName ??
    requestData?.venter?.anonymousName ??
    'Anonymous';

  const isCall = requestType === 'call';

  const ratePerMinute = requestData?.ratePerMinute;
  const rateDisplay = ratePerMinute
    ? `$${Number(ratePerMinute).toFixed(2)}/min`
    : isCall ? '$0.15–$0.20/min' : '$0.15–$0.20/min';

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <MainBackground />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

        {/* Status: loading */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <p className="text-white/70 text-sm">{t('Common.loading', 'Loading…')}</p>
          </div>
        )}

        {/* Status: not found */}
        {status === 'not_found' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center">
              <PhoneOff size={36} className="text-white/50" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('IncomingRequest.notFound', 'Request not found')}</h2>
            <p className="text-white/60 text-sm">{t('IncomingRequest.notFoundDesc', 'This request could not be found.')}</p>
            <button
              onClick={() => navigate('/listener/home', { replace: true })}
              className="mt-4 px-6 py-3 rounded-2xl glass border border-white/10 text-white text-sm font-medium"
            >
              {t('Common.goHome', 'Go to Home')}
            </button>
          </div>
        )}

        {/* Status: expired / already handled */}
        {status === 'expired' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center">
              <PhoneOff size={36} className="text-white/50" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('IncomingRequest.expired', 'Request no longer available')}</h2>
            <p className="text-white/60 text-sm">{t('IncomingRequest.expiredDesc', 'This request has already been accepted, declined, or cancelled.')}</p>
            <button
              onClick={() => navigate('/listener/home', { replace: true })}
              className="mt-4 px-6 py-3 rounded-2xl glass border border-white/10 text-white text-sm font-medium"
            >
              {t('Common.goHome', 'Go to Home')}
            </button>
          </div>
        )}

        {/* Status: ready — incoming call/chat UI */}
        {status === 'ready' && (
          <>
            {/* Pulsing avatar */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-36 h-36 rounded-full bg-white/5 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-28 h-28 rounded-full bg-white/8 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
              <div className="relative w-24 h-24 rounded-full glass border border-white/20 flex items-center justify-center shadow-glow-primary">
                <span className="text-4xl font-bold text-white">
                  {(venterName[0] || 'V').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Name & session type */}
            <div className="text-center">
              <p className="text-white/60 text-sm mb-1">
                {isCall
                  ? t('IncomingRequest.incomingCall', 'Incoming Call')
                  : t('IncomingRequest.incomingChat', 'Incoming Chat')}
              </p>
              <h2 className="text-2xl font-bold text-white">{venterName}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-white/50 text-xs">
                {isCall ? <Phone size={12} /> : <MessageSquare size={12} />}
                <span>{isCall ? t('ListenerHome.callSession', 'Call Session') : t('ListenerHome.chatSession', 'Chat Session')}</span>
              </div>
            </div>

            {/* Payout rate badge */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-500/15 border border-green-500/35">
              <span className="text-green-400 text-sm font-semibold">💰 You earn {rateDisplay}</span>
            </div>

            {/* Accept / Decline buttons */}
            <div className="flex items-center gap-10 mt-4">
              {/* Decline */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleDecline}
                  disabled={accepting || declining}
                  className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {declining
                    ? <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <PhoneOff size={28} />}
                </button>
                <span className="text-xs text-white/50">{t('Common.decline', 'Decline')}</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleAccept}
                  disabled={accepting || declining}
                  className="w-[72px] h-[72px] rounded-full bg-green-500/25 border border-green-500/50 flex items-center justify-center text-green-400 hover:bg-green-500/35 transition-all disabled:opacity-50"
                >
                  {accepting
                    ? <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    : <PhoneIncoming size={28} />}
                </button>
                <span className="text-xs text-white/50">{t('Common.accept', 'Accept')}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <MicPermissionModal />
    </div>
  );
};
