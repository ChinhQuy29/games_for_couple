import { createGameClient } from '@gfc/kit/client';
import type { PublicState } from '../shared';

export const kit = createGameClient<PublicState>({ ns: '/kitchen', key: 'kitchen', basePath: '/kitchen' });
