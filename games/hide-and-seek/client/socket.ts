import { io, type Socket } from 'socket.io-client';
import type { Ack } from '../shared';

let socket: Socket | null = null;

/** One shared connection to the /hns namespace, created on first use. */
export function getSocket(): Socket {
  socket ??= io('/hns', { transports: ['websocket', 'polling'] });
  return socket;
}

export async function emit<T extends object = object>(event: string, payload: object = {}): Promise<Ack<T>> {
  try {
    return (await getSocket().timeout(6000).emitWithAck(event, payload)) as Ack<T>;
  } catch {
    return { ok: false, code: 'BAD_INPUT', message: 'Connection hiccup — try again 📡' };
  }
}
