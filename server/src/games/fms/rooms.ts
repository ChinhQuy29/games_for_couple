import { randomBytes, randomUUID } from 'node:crypto';
import { ROOM_CODE_ALPHABET, TIMING, type Room } from '@gfc/shared';
import { addPlayer, newRoom, type Ctx } from './game';

export class RoomStore {
  private rooms = new Map<string, Room>();
  /** When each room last had zero connected players. */
  private emptySince = new Map<string, number>();

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  create(name: string, ctx: Ctx) {
    let code: string;
    do {
      code = Array.from({ length: 4 }, () => ROOM_CODE_ALPHABET[Math.floor(ctx.rng() * ROOM_CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    const room = newRoom(code, ctx);
    const player = addPlayer(room, newIdentity(name));
    this.rooms.set(code, room);
    return { room, player };
  }

  join(room: Room, name: string) {
    return addPlayer(room, newIdentity(name));
  }

  delete(code: string): void {
    this.rooms.delete(code);
    this.emptySince.delete(code);
  }

  /** Drops idle or abandoned rooms. Returns deleted codes so timers can be cleared. */
  sweep(now: number): string[] {
    const deleted: string[] = [];
    for (const [code, room] of this.rooms) {
      const anyoneHere = room.players.some((p) => p.connected);
      if (anyoneHere) this.emptySince.delete(code);
      else if (!this.emptySince.has(code)) this.emptySince.set(code, now);
      const empty = this.emptySince.get(code);
      if (now - room.lastActivityAt > TIMING.roomIdleMs || (empty !== undefined && now - empty > TIMING.roomEmptyMs)) {
        this.delete(code);
        deleted.push(code);
      }
    }
    return deleted;
  }
}

function newIdentity(name: string) {
  return { id: randomUUID().slice(0, 8), token: randomBytes(18).toString('base64url'), name };
}
