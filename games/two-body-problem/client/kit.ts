import { createGameClient } from '@gfc/kit/client';
import type { PublicState } from '../shared';

export const kit = createGameClient<PublicState>({ ns: '/twobody', key: 'twobody', basePath: '/two-body-problem' });
