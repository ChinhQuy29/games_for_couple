import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { attachJjinja, BASE_PATH as JJINJA_PATH, handleHttp as jjinjaHttp } from '@gfc/jjinja';
import { registerAog } from '@gfc/aog/server';
import { registerDoodle } from '@gfc/doodle/server';
import { registerFms } from '@gfc/fms/server';
import { registerHns } from '@gfc/hns/server';
import { registerRush } from '@gfc/rush/server';
import { registerBomb } from '@gfc/bomb/server';
import { registerKitchen } from '@gfc/kitchen/server';
import { registerGhost } from '@gfc/ghost/server';
import { registerTethered } from '@gfc/tethered/server';
import { registerTwoBody } from '@gfc/twobody/server';
import { registerMovingIn } from '@gfc/movingin/server';
import { registerWyr } from '@gfc/wyr/server';

// `--port` wins so `npm run dev` always lands on 3001 (Vite proxies there); hosts set PORT in prod.
const portArg = process.argv.indexOf('--port');
const PORT = Number(portArg > -1 ? process.argv[portArg + 1] : (process.env.PORT ?? 3001));
// deploy/setup.sh sets HOST=127.0.0.1 so only Caddy can reach the app.
const HOST = process.env.HOST;
const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');

const app = express();
app.get('/health', (_req, res) => {
  res.send('ok');
});

// Jjinja Battle is its own static site + WebSocket game, mounted under /jjinja.
app.use(JJINJA_PATH, (req, res) => void jjinjaHttp(req, res));

// In production the server also hosts the built portal. In dev, Vite does.
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const httpServer = createServer(app);
// destroyUpgrade: false so Socket.IO leaves other games' WebSocket upgrades (Jjinja's /jjinja/ws) alone.
const io = new Server(httpServer, { destroyUpgrade: false });

// One namespace per Socket.IO game; Jjinja brings its own `ws` server.
registerFms(io);
registerDoodle(io);
registerWyr(io);
registerAog(io);
registerHns(io);
registerRush(io);
registerBomb(io);
registerKitchen(io);
registerGhost(io);
registerTethered(io);
registerTwoBody(io);
registerMovingIn(io);
attachJjinja(httpServer);

const onListening = () => console.log(`💞 Games for Couple server on http://${HOST ?? 'localhost'}:${PORT}`);
if (HOST) httpServer.listen(PORT, HOST, onListening);
else httpServer.listen(PORT, onListening);
