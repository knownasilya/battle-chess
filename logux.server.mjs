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
let rooms = [];
let roomAccess = {};

server.channel('counter', {
  access() {
    // Access control is mandatory
    return true;
  },
  async load(ctx) {
    // Load initial state when client subscribing to the channel.
    // You can use any database.
    return { type: 'counter/INC', payload: count };
  },
});

server.type('counter/INC', {
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

server.channel('foyer', {
  access() {
    return true;
  },

  async load(ctx) {
    // Load initial state when client subscribing to the channel.
    // You can use any database.
    return { type: 'foyer/LIST_ROOMS', payload: rooms };
  },
});

server.type('foyer/LIST_ROOMS', {
  access() {
    return true;
  },
  resend() {
    return 'foyer';
  },
  async process(ctx) {
    // noop
    ctx.sendBack({ type: 'foyer/LIST_ROOMS', payload: rooms });
  },
});

server.type('foyer/ADD_ROOM', {
  access() {
    return true;
  },
  resend() {
    return 'foyer';
  },
  async process(ctx, action) {
    rooms.push(action.payload);
    ctx.sendBack({ type: 'foyer/LIST_ROOMS', payload: rooms });
  },
});

server.channel('room/:name', {
  access() {
    return true;
  },
  async load(ctx) {
    if (!roomAccess[ctx.params.name]) {
      roomAccess[ctx.params.name] = [];
    }
    roomAccess[ctx.params.name].push(ctx.userId);
    // Load initial state when client subscribing to the channel.
    // You can use any database.
    return { type: 'room/GET_DETAILS', payload: { name: ctx.params.name } };
  },
});

server.listen();
