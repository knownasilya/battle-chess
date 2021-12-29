import { Server } from '@logux/server';

const env = process.env.NODE_ENV || 'development';
const server = new Server(
  Server.loadOptions(process, {
    subprotocol: '1.0.0',
    supports: '1.x',
    fileUrl: import.meta.url,
  })
);

server.auth(({ userId, token }) => {
  // Allow only local users until we will have a proper authentication
  return env === 'development';
});

let count = 0;

server.channel('counter', {
  access() {
    // Access control is mandatory
    return true;
  },
  async load(ctx) {
    // Load initial state when client subscribing to the channel.
    // You can use any database.
    return { type: 'INC', value: count };
  },
});

server.type('INC', {
  access() {
    return true;
  },
  resend() {
    return 'counter';
  },
  async process() {
    // Don’t forget to keep action atomic

    count += 1;
  },
});

server.listen();
