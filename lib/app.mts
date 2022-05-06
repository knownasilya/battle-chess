import { Server } from '@logux/server';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { games, users } from './state.mjs';
import gameChannel from './channels/game.mjs';

// Since we are in ESM scope, we don't have __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-disable-next-line no-undef
const env = process.env.NODE_ENV || 'development';
const server = new Server(
  // eslint-disable-next-line no-undef
  Server.loadOptions(process, {
    subprotocol: '1.0.0',
    supports: '1.x',
    host: '0.0.0.0',
    root: __dirname,
  })
);

server.auth(({ userId }) => {
  if (!users.find((user) => user.id === userId)) {
    users.push({ id: userId });
  }
  // Allow only local users until we will have a proper authentication
  return env === 'development';
});

gameChannel(server);

server.listen();
