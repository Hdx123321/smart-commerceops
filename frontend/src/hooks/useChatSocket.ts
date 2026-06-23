import { useEffect, useState } from 'react';
import {
  connectChatSocket,
  subscribeConnectionState,
  type ChatConnectionState,
} from '../api/chatSocketClient';

export function useChatSocket() {
  const [state, setState] = useState<ChatConnectionState>('disconnected');

  useEffect(() => {
    const unsubscribe = subscribeConnectionState(setState);
    connectChatSocket();
    return unsubscribe;
  }, []);

  return {
    state,
    connected: state === 'connected',
  };
}
