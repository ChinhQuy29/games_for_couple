/**
 * One pending wake-up per room. Besides the phase deadline, the server wakes for
 * taunts (start and end) so the fake's wiggle is driven by the server.
 */
export class RoomTimers {
  private handles = new Map<string, { at: number; handle: NodeJS.Timeout }>();

  constructor(private onFire: (code: string) => void) {}

  sync(code: string, at: number | null): void {
    const existing = this.handles.get(code);
    if (existing && existing.at === at) return;
    this.clear(code);
    if (at === null) return;
    const handle = setTimeout(
      () => {
        this.handles.delete(code);
        this.onFire(code);
      },
      Math.max(0, at - Date.now()),
    );
    this.handles.set(code, { at, handle });
  }

  clear(code: string): void {
    const existing = this.handles.get(code);
    if (existing) clearTimeout(existing.handle);
    this.handles.delete(code);
  }
}
