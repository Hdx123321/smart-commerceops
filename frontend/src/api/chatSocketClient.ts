import { Client, ReconnectionTimeMode, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { accessToken } from './client';
import type { ChatEvent } from '../types';

export type ChatConnectionState = 'connecting' | 'connected' | 'disconnected';

let client: Client | null = null;
let activeToken: string | null = null;
let state: ChatConnectionState = 'disconnected';
const stateListeners = new Set<(next: ChatConnectionState) => void>();

function notify(next: ChatConnectionState) {
  state = next;
  stateListeners.forEach((listener) => listener(next));
}

function websocketUrl() {
  const configured = import.meta.env.VITE_CHAT_WS_URL;
  if (configured) return configured;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws-chat`;
}

export function connectChatSocket() {
  const token = accessToken();
  if (!token) {
    notify('disconnected');
    return;
  }
  if (client?.active && activeToken === token) return;
  if (client?.active) void client.deactivate();

  activeToken = token;
  notify('connecting');
  client = new Client({
    brokerURL: websocketUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: 1000,
    reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
    maxReconnectDelay: 30000,
    onConnect: () => notify('connected'),
    onWebSocketClose: () => notify('disconnected'),
    onStompError: () => notify('disconnected'),
  });
  client.activate();
}

export async function disconnectChatSocket() {
  activeToken = null;
  const activeClient = client;
  client = null;
  if (activeClient?.active) await activeClient.deactivate();
  notify('disconnected');
}

export function subscribeConnectionState(listener: (next: ChatConnectionState) => void) {
  stateListeners.add(listener);
  listener(state);
  return () => {
    stateListeners.delete(listener);
  };
}

export function subscribeChat(destination: string, listener: (event: ChatEvent) => void): StompSubscription {
  if (!client?.connected) throw new Error('Chat socket is not connected');
  return client.subscribe(destination, (message: IMessage) => listener(JSON.parse(message.body) as ChatEvent));
}

export function publishChat(destination: string, body: object = {}) {
  if (!client?.connected) throw new Error('Chat socket is not connected');
  client.publish({ destination, body: JSON.stringify(body) });
}
