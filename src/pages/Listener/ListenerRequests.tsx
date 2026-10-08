import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { removeRequest, setRequests } from '../../store/slices/listenerSlice';
import { sessionStarted, chatSessionStarted } from '../../store/slices/callSlice';
import { setSessionInfo } from '../../store/slices/sessionSlice';
import type { RootState } from '../../store/store';
import apiInstance from '../../api/apiInstance';
import { toastError } from '../../utils/toast';
import { useMicPermission } from '../../hooks/useMicPermission';
import { Phone, MessageSquare, User, Loader2 } from 'lucide-react';
import socketService from '../../api/socketService';

export const ListenerRequests = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  // Get requests from Redux store (populated by socket or direct fetch)
  const requests = useSelector((state: RootState) => state.listener.requests);

  // On mount: if URL has ?requestId=...&type=..., fetch that specific request
  // directly from the API (deep link from SMS/email). Otherwise fall back to
  // socket-based hydration.
  useEffect(() => {
    let cancelled = false;
    const requestId = searchParams.get('requestId');
    const requestType = searchParams.get('type'); // 'call' or 'chat'

    const fetchDirectRequest = async () => {
      try {
        const endpoint = requestType === 'chat'
          ? `chat/${requestId}`
          : `calls/${requestId}`;
        const res = await apiInstance.get(endpoint);
        if (cancelled) return;
        const data = res.data?.call ?? res.data?.conversation ?? res.data;
        if (data && (data.status === 'requesting' || data.status === 'pending')) {
          dispatch(setRequests([{
            id: requestId!,
            type: requestType === 'chat' ? 'message' : 'call',
            title: data.requester?.anonymousName ?? data.venter?.anonymousName ?? 'Anonymous',
            requestType: requestType === 'chat' ? 'chat' : 'call',
            requestId: requestId,
            venterId: data.venterId ?? data.venter?.id ?? null,
            listenerId: data.listenerId ?? data.listener?.id ?? null,
            ratePerMinute: data.ratePerMinute ?? null,
          }]));
        }
      } catch (e) {
        console.warn('[ListenerRequests] direct fetch failed:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (requestId) {
      // Deep link from SMS/email — fetch the specific request immediately
      fetchDirectRequest();
      return () => { cancelled = true; };
    }

    // No deep link — fall back to socket-based hydration
    const handleLatest = (data: any) => {
      if (cancelled) return;
      const mapped = (data?.requests ?? []).map((item: any) => ({
        id: item.requestId ?? item.id,
        type: (item.requestType === 'call' ? 'call' : 'message') as 'call' | 'message',
        title: item.requester?.anonymousName ?? item.title ?? 'Anonymous',
        requestType: item.requestType ?? null,
        requestId: item.requestId ?? null,
        venterId: item.requester?.id ?? item.venterId ?? null,
        listenerId: item.listenerId ?? null,
        ratePerMinute: item.ratePerMinute ?? null,
      }));
      if (mapped.length > 0) dispatch(setRequests(mapped));
      setIsLoading(false);
    };

    socketService.on('requests:latest', handleLatest);
    socketService.emit('requests:get');

    const handleConnect = () => { if (!cancelled) socketService.emit('requests:get'); };
    socketService.on('connect', handleConnect);

    const timer = setTimeout(() => { if (!cancelled) setIsLoading(false); }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      socketService.off('requests:latest', handleLatest);
      socketService.off('connect', handleConnect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { ensureMicPermission, MicPermissionModal } = useMicPermission();

  const handleAccept = async (req: (typeof requests)[number]) => {
    // For call requests, show the mic permission modal while still inside the
    // button-click gesture so mobile browsers trigger the native dialog.
    if (req.type === 'call') {
      const micGranted = await ensureMicPermission();
      if (!micGranted) return;
    }

    try {
      if (req.type === 'call') {
        const res = await apiInstance.post(`calls/${req.id}/accept`);
        const call = res.data?.call ?? res.data;
        const roomId = call?.channelName || res.data?.roomId || req.requestId || req.id;

        dispatch(removeRequest(req.id));
        dispatch(sessionStarted({ sessionId: req.requestId ?? req.id }));
        dispatch(
          setSessionInfo({
            sessionId: req.requestId ?? req.id ?? null,
            requestId: req.requestId ?? null,
            venterId: req.venterId ?? null,
            listenerId: req.listenerId ?? null,
            sessionType: 'call',
            data: { ...req, ...res.data },
          }),
        );

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
        return;
      }

      // Chat request
      const res = await apiInstance.post(`conversations/${req.id}/accept`);
      const chatData = res.data;
      const conversationId =
        chatData?.conversationId || chatData?.conversation?.id || chatData?.id || req.requestId || req.id;

      dispatch(chatSessionStarted({ chatData, chatStartTime: Date.now(), conversationId }));
      dispatch(
        setSessionInfo({
          sessionId: req.requestId ?? conversationId ?? null,
          requestId: req.requestId ?? null,
          venterId: req.venterId ?? chatData?.conversation?.venterId ?? null,
          listenerId: req.listenerId ?? chatData?.listenerId ?? chatData?.listener?.id ?? null,
          sessionType: 'chat',
          data: chatData,
        }),
      );
      dispatch(removeRequest(req.id));

      navigate(`/listener/chat/${conversationId}`, { replace: true, state: { chat: chatData } });
    } catch (e: any) {
      toastError(e?.error || t('Common.somethingWentWrong'));
    }
  };

  const handleDecline = async (req: (typeof requests)[number]) => {
    try {
      if (req.type === 'call') {
        await apiInstance.post(`calls/${req.id}/decline`);
      } else {
        await apiInstance.post(`conversations/${req.id}/decline`);
      }
      dispatch(removeRequest(req.id));
    } catch (e: any) {
      toastError(e?.error || t('Common.somethingWentWrong'));
    }
  };

  return (
    <div className="page-wrapper page-wrapper--wide animate-fade-in">
      <PageHeader title={t('ListenerHome.incomingRequests', 'Incoming Requests')} subtitle={t('ListenerRequests.subtitle', 'Accept or decline venter connection requests')} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={32} className="animate-spin text-white/60" />
          <p className="text-sm text-white/60">{t('ListenerRequests.checking', 'Checking for requests…')}</p>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title={t('ListenerHome.noRequests', 'No pending requests')}
          description={t('ListenerHome.noRequestsDesc', 'New requests will appear here when venters seek support.')}
          icon={<User size={22} />}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <GlassCard key={req.id} bordered padding="md" rounded="2xl" className="transform transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full glass flex items-center justify-center text-base font-bold text-white flex-shrink-0 shadow-inner">
                  {(req.title?.[0] || 'V').toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{req.title || 'Anonymous'}</p>
                  <div className="flex items-center gap-1 text-xs text-white/80 mt-0.5">
                    {req.type === 'call' ? <Phone size={11} /> : <MessageSquare size={11} />}
                    <span className="capitalize">{req.type === 'call' ? t('ListenerHome.callSession', 'Call Session') : t('ListenerHome.chatSession', 'Chat Session')}</span>
                  </div>
                </div>
              </div>


              <div className="flex gap-3 mt-4">
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => handleDecline(req)}
                >
                  {t('Common.decline', 'Cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => handleAccept(req)}
                >
                  {t('Common.accept', 'Begin Session')}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      <MicPermissionModal />
    </div>
  );
};
