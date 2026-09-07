import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import socketService from '../socketService';

function isOnChatDetailScreen(
  pathname: string,
  role: 'venter' | 'listener',
  conversationId: string,
): boolean {
  if (role === 'listener') {
    return pathname === `/listener/chat/${conversationId}`;
  }
  return pathname === `/venter/chat/${conversationId}`;
}

/**
 * While a chat session is active in Redux, keep emitting `chat:join` when the user is
 * not on the chat detail screen (e.g. listener went back to home / request list).
 * ChatScreen only mounts on `/…/chat/:id`; without this, leaving that screen can look
 * like leaving the room and some backends end the conversation for the other party.
 */
export function useBackgroundChatRoomJoin(role: 'venter' | 'listener') {
  const location = useLocation();
  const isChatActive = useSelector((s: RootState) => s.call.isChatActive);
  const activeConversationId = useSelector((s: RootState) => s.call.activeConversationId);

  useEffect(() => {
    if (!isChatActive || !activeConversationId) return;
    if (isOnChatDetailScreen(location.pathname, role, activeConversationId)) return;

    let cancelled = false;
    (async () => {
      try {
        await socketService.connect();
        if (cancelled) return;
        socketService.emit('chat:join', { conversationId: activeConversationId });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isChatActive, activeConversationId, location.pathname, role]);
}
