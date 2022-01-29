import { Server } from '@logux/server';
import dealCards from './deal-cards.mjs';

type RoomDetails = {
  w?: string;
  b?: string;
  turn: 'b' | 'w';
  fen?: string;
};

// eslint-disable-next-line no-undef
const env = process.env.NODE_ENV || 'development';
const server = new Server(
  // eslint-disable-next-line no-undef
  Server.loadOptions(process, {
    subprotocol: '1.0.0',
    supports: '1.x',
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
  [K in string]: RoomDetails;
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
        b: undefined,
        w: undefined,
        turn: 'w',
        fen: undefined,
      };
    }

    if (!roomAccess[id].w) {
      roomAccess[id].w = ctx.userId;
    } else if (!roomAccess[id].b && roomAccess[id].w !== ctx.userId) {
      roomAccess[id].b = ctx.userId;
    }

    return {
      type: `room/ENTERED`,
      payload: { ...roomAccess[id], cards: dealCards() },
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

server.type<{
  type: string;
  payload: { fen: string; roomId: string; move: { from: string; to: string } };
}>('room/MOVE_PIECE', {
  access(ctx, action) {
    const room = roomAccess[action.payload.roomId];
    console.log(room);
    if (!room) {
      return false;
    }

    const isDark = room.b === ctx.userId;
    const isLight = room.w === ctx.userId;
    const isPlayer = isLight || isDark;

    console.log({ isDark, isLight, isPlayer });

    if (!isPlayer) {
      return false;
    }

    const turn = getCurrentTurn(room, ctx.userId);

    return (turn === 'w' && isLight) || (turn === 'b' && isDark);
  },
  resend(ctx, action) {
    return `room/${action.payload.roomId}`;
  },
  async process(ctx, action) {
    const room = roomAccess[action.payload.roomId];

    if (room) {
      room.fen = action.payload.fen;
    }

    const opponentsId = getOpponentsId(room, ctx.userId);

    if (!opponentsId) {
      return;
    }

    server.log.add(
      {
        type: 'room/TURN_FINISHED',
        payload: { move: action.payload.move, fen: room.fen },
      },
      { users: [opponentsId] }
    );
  },
});

server.type('room/TURN_FINISHED', {
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

server.listen();

function getOpponentsId(room: RoomDetails, currentUserId: string) {
  if (room.w === currentUserId) {
    return room.b;
  }

  if (room.b === currentUserId) {
    return room.w;
  }
}

function getCurrentTurn(
  room: RoomDetails,
  currentUserId: string
): 'b' | 'w' | undefined {
  if (currentUserId === room.b) {
    return 'b';
  } else if (currentUserId === room.w) {
    return 'w';
  }
}
