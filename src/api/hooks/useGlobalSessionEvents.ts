import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useStore } from 'react-redux';
import type { RootState } from '../../store/store';
import { endCall, endChatSession, setCrisisEnded } from '../../store/slices/callSlice';
import socketService from '../socketService';
import { useAgoraContext } from '../../contexts/AgoraContext';

/**
 * Attaches global call:ended / chat:ended socket listeners so that
 * navigation to the post-session screens happens from ANY screen,
 * not just the active call/chat screen.
 *
 * Uses store.getState() (not render-cycle refs) so that a dispatch()
 * made immediately before navigate() is visible synchronously — this
 * prevents the listener's own crisis/end handler from also triggering
 * a feedback-screen redirect when the server echoes back the ended event.
 */
export function useGlobalSessionEvents(role: 'venter' | 'listener') {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const { leaveChannel } = useAgoraContext();

  useEffect(() => {
    const handleCallEnded = async (data: any) => {
      const state = (store.getState() as RootState).call;
      console.log('[GlobalSessionEvents]', role, 'RECEIVED call:ended', { data, isActive: state.isActive, crisisEnded: state.crisisEnded });
      // Skip if already ended or crisis overlay already showing (set by session:ended handler)
      if (!state.isActive || state.crisisEnded) return;
      dispatch(endCall());
      await leaveChannel();
      const sid = state.sessionId ?? data?.callId ?? data?.id ?? data?.call?.id;
      const firstStep = role === 'listener' ? 'feedback' : 'rating';
      const target = sid ? `/${role}/session/${sid}/${firstStep}` : `/${role}/home`;
      navigate(target, { replace: true, state: { type: 'call' } });
    };

    const handleChatEnded = (data: any) => {
      const state = (store.getState() as RootState).call;
      // Skip if already ended or crisis overlay is already showing
      if (!state.isChatActive || state.crisisEnded) return;
      dispatch(endChatSession());
      const cid = state.activeConversationId ?? data?.conversationId ?? data?.id;
      const firstStep = role === 'listener' ? 'feedback' : 'rating';
      const target = cid ? `/${role}/session/${cid}/${firstStep}` : `/${role}/home`;
      navigate(target, { replace: true, state: { type: 'chat' } });
    };

    // Both clients receive session:ended when session:crisis_end is emitted.
    // Listener: already dispatched endCall/endChatSession locally so state is inactive — handler exits early.
    // Venter on call: handled directly in ActiveCall.tsx — this fallback only fires if the venter
    // navigated away from the active call screen (or for chat where global handling is fine).
    const handleSessionEnded = async (data: any) => {
      const state = (store.getState() as RootState).call;
      console.log('[GlobalSessionEvents]', role, 'RECEIVED session:ended', {
        data,
        isActive: state.isActive,
        isChatActive: state.isChatActive,
      });

      if (state.isActive) {
        dispatch(endCall());
        try { await leaveChannel(); } catch { /* ignore */ }
        if (role === 'venter') {
          // Set flag in case ActiveCall.tsx is the one rendered — its useSelector wakes up the overlay
          dispatch(setCrisisEnded(true));
        } else if (!data?.skipTip) {
          const sid = state.sessionId;
          navigate(sid ? `/listener/session/${sid}/feedback` : '/listener/home', { replace: true, state: { type: 'call' } });
        }
      } else if (state.isChatActive) {
        dispatch(endChatSession());
        if (role === 'venter') {
          dispatch(setCrisisEnded(true));
        } else if (!data?.skipTip) {
          const cid = state.activeConversationId;
          navigate(cid ? `/listener/session/${cid}/feedback` : '/listener/home', { replace: true, state: { type: 'chat' } });
        }
      } else {
        console.log('[GlobalSessionEvents]', role, 'session:ended ignored — no active call or chat');
      }
    };

    socketService.on('call:ended', handleCallEnded);
    socketService.on('chat:ended', handleChatEnded);
    socketService.on('session:ended', handleSessionEnded);

    return () => {
      socketService.off('call:ended', handleCallEnded);
      socketService.off('chat:ended', handleChatEnded);
      socketService.off('session:ended', handleSessionEnded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
}
