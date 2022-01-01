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
    light: string;
    dark: string;
    turn: 'light' | 'dark';
    fen?: string;
  };
} = {};

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
      roomAccess[id] = {
        light: undefined,
        dark: undefined,
        turn: 'light',
        fen: undefined,
      };
    }

    if (!roomAccess[id].light) {
      roomAccess[id].light = ctx.userId;
    } else if (!roomAccess[id].dark) {
      roomAccess[id].dark = ctx.userId;
    }

    return {
      type: `room/ENTERED`,
      payload: { ...roomAccess[id] },
    };
  },
});

server.type('room/ENTERED', {
  access() {
    return true;
  },
  resend(ctx, action) {
    return `room`;
  },
  async process(ctx, action) {
    // noop
    // test
  },
});

server.type<{ type: string; payload: { fen: string; roomId: string } }>(
  'room/MOVE_PIECE',
  {
    access(ctx, action) {
      const room = roomAccess[action.payload.roomId];
      console.log(room);
      if (!room) {
        return false;
      }

      const isDark = room.dark === ctx.userId;
      const isLight = room.light === ctx.userId;
      const isPlayer = isLight || isDark;

      console.log({ isDark, isLight, isPlayer });

      if (!isPlayer) {
        return false;
      }

      return (
        (room.turn === 'light' && isLight) || (room.turn === 'dark' && isDark)
      );
    },
    resend(ctx, action) {
      return `room/${action.payload.roomId}`;
    },
    async process(ctx, action) {
      const room = roomAccess[action.payload.roomId];

      if (room) {
        room.fen = action.payload.fen;
        room.turn = room.turn === 'light' ? 'dark' : 'light';
      }

      ctx.sendBack({ type: 'room/ENTERED', payload: room });
    },
  }
);

server.listen();
