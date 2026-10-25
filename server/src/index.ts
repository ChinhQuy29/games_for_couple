import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { registerFms } from './games/fms/namespace';

// `--port` wins so `npm run dev` always lands on 3001 (Vite proxies there); hosts set PORT in prod.
const portArg = process.argv.indexOf('--port');
const PORT = Number(portArg > -1 ? process.argv[portArg + 1] : (process.env.PORT ?? 3001));
const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');

const app = express();
app.get('/health', (_req, res) => {
  res.send('ok');
});

// In production the server also hosts the built portal. In dev, Vite does.
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

const httpServer = createServer(app);
const io = new Server(httpServer);

// One namespace per real-time game.
registerFms(io);

httpServer.listen(PORT, () => {
  console.log(`💞 Games for Couple server on http://localhost:${PORT}`);
});
