import { Server } from '@logux/server';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dealCards from './deal-cards.mjs';
import shortUUID from 'short-uuid';
import { Game, RoomDetails, User } from 'shared/index.js';

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

const rooms: string[] = [];
const games: Game[] = [];
const users: User[] = [];
const roomAccess: {
  [K in string]: RoomDetails;
} = {};

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

server.type<{ type: string; payload: { name: string } }>('foyer/START_GAME', {
  access() {
    return true;
  },
  resend() {
    return 'foyer';
  },
  async process(ctx, action) {
    // Create a new game
    const id = shortUUID.generate().toString();
    const side = blackOrWhite();
    const turn = blackOrWhite();
    const game: Game = {
      id,
      [side]: ctx.userId,
      turn,
    };

    games.push(game);

    // Update user
    const user = users.find((u) => u.id === ctx.userId);

    if (user) {
      user.name = action.payload.name;
    }

    ctx.sendBack({ type: 'foyer/GAME_CREATED', payload: { id } });
  },
});

server.channel<{ id: string }>('game/:id', {
  access() {
    return true;
  },

  async load(ctx) {
    const game = games.find((game) => game.id === ctx.params.id);
    return { type: `game/${ctx.params.id}/DETAILS`, payload: game };
  },
});

server.type<
  { type: string; payload: { id: string; name: string } },
  { test: boolean }
>('game/JOIN', {
  access(ctx, action) {
    const game = games.find((g) => g.id === action.payload.id);

    if (!game || (game?.b && game?.w)) {
      return false;
    }

    return true;
  },
  resend(ctx, action) {
    return `game/${action.payload.id}`;
  },
  async process(ctx, action) {
    const game = games.find((g) => g.id === action.payload.id);

    if (!game) {
      return;
    }

    ctx.sendBack({
      type: `game/${action.payload.id}/JOINED`,
    });
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

function blackOrWhite() {
  const num = rand();
  return num === 0 ? 'w' : 'b';
}

function rand() {
  return Math.round(Math.random());
}
