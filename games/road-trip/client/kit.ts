import { createGameClient } from '@gfc/kit/client';
import type { PublicState } from '../shared';

export const kit = createGameClient<PublicState>({ ns: '/roadtrip', key: 'roadtrip', basePath: '/road-trip' });
