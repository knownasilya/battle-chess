import { Server } from '@logux/server';

const env = process.env.NODE_ENV || 'development';
const server = new Server(
  Server.loadOptions(process, {
    subprotocol: '1.0.0',
    supports: '1.x',
    // @ts-expect-error known
    fileUrl: import.meta.url,
  })
);

server.auth(() => {
  // Allow only local users until we will have a proper authentication
  return env === 'development';
});

let count = 0;
const rooms: string[] = [];
const roomAccess: {
  [K in string]: {
    users: string[];
    turn: string;
    fen?: string;
  };
} = {};
let lastFen = undefined;

server.channel('counter', {
  access() {
    // Access control is mandatory
    return true;
  },
  async load() {
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

  async load() {
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

server.channel<{ id: string }>('room/:id', {
  access() {
    return true;
  },
  async load(ctx) {
    const id = ctx.params.id;

    if (!roomAccess[id]) {
      roomAccess[id] = { users: [], turn: ctx.userId, fen: undefined };
    }

    roomAccess[id].users.push(ctx.userId);

    return {
      type: `room/END_MOVE`,
      payload: { roomId: id, fen: roomAccess[id].fen },
    };
  },
});

server.type('room/END_MOVE', {
  access() {
    return true;
  },
  resend(ctx, action) {
    return `room/${action.payload.roomId}`;
  },
  async process(ctx, action) {
    const room = roomAccess[action.payload.roomId];

    if (room) {
      room.fen = action.payload.fen;
    }
  },
});

server.listen();
