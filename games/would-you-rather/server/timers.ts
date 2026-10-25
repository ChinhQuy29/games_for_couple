import { TIMING, type Room } from '../shared';

/** One pending timeout per room, re-synced after every state change. */
export class RoomTimers {
  private handles = new Map<string, { deadline: number; handle: NodeJS.Timeout }>();

  constructor(private onFire: (code: string) => void) {}

  sync(room: Room): void {
    const existing = this.handles.get(room.code);
    if (existing && existing.deadline === room.deadline) return;
    this.clear(room.code);
    if (room.deadline === null) return;
    const delay = Math.max(0, room.deadline + TIMING.graceMs - Date.now());
    const handle = setTimeout(() => {
      this.handles.delete(room.code);
      this.onFire(room.code);
    }, delay);
    this.handles.set(room.code, { deadline: room.deadline, handle });
  }

  clear(code: string): void {
    const existing = this.handles.get(code);
    if (existing) clearTimeout(existing.handle);
    this.handles.delete(code);
  }
}
