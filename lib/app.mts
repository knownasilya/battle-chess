import { Context, Server } from '@logux/server';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dealCards from './deal-cards.mjs';
import shortUUID from 'short-uuid';
import { Game, Side, User } from 'shared/index.js';

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

const games: Game[] = [];
const users: User[] = [];

const findGameOrThrow = (id: string) => {
  const game = games.find((g) => g.id === id);

  if (!game) {
    throw new Error(`Game with ID {${id}} not found`);
  }

  return game;
};

server.channel('foyer', {
  access() {
    return true;
  },

  async load() {
    // Load initial state when client subscribing to the channel.
    // You can use any database.
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

    ctx.sendBack({ type: 'foyer/GAME_CREATED', payload: { gameId: id } });
  },
});

server.channel<{ id: string }>('game/:id', {
  access(ctx) {
    const game = findGameOrThrow(ctx.params.id);
    const { yours } = getSides(ctx, game);

    if (game[yours] && game[yours] !== ctx.userId) {
      return false;
    }

    return true;
  },

  async load(ctx) {
    const game = games.find((game) => game.id === ctx.params.id);
    return {
      type: `game/${ctx.params.id}/DETAILS`,
      payload: { ...game, cards: dealCards() },
    };
  },
});

server.type<{ type: string; payload: { gameId: string; name: string } }>(
  'game/JOIN',
  {
    access(ctx, action) {
      const game = games.find((g) => g.id === action.payload.gameId);

      if (!game || (game?.b && game?.w)) {
        return false;
      }

      return true;
    },
    resend(ctx, action) {
      return `game/${action.payload.gameId}`;
    },
    async process(ctx, action) {
      const game = games.find((g) => g.id === action.payload.gameId);

      if (!game) {
        return;
      }

      const { yours, opponents } = getSides(ctx, game);
      console.log({ yours, opponents, game, userId: ctx.userId });
      game[yours] = ctx.userId;

      ctx.sendBack({
        type: `game/${action.payload.gameId}/JOINED`,
      });

      server.log.add(
        {
          type: `game/${action.payload.gameId}/DETAILS`,
          payload: game,
        },
        { channel: `game/${action.payload.gameId}` }
      );
    },
  }
);

server.type<{ type: string; payload: { gameId: string } }>('game/PLAY', {
  access(ctx, action) {
    const game = games.find((g) => g.id === action.payload.gameId);

    if (!game || !game?.b || !game?.w) {
      return false;
    }

    return true;
  },
  resend(ctx, action) {
    return `game/${action.payload.gameId}`;
  },
  async process(ctx, action) {
    server.log.add(
      {
        type: `game/${action.payload.gameId}/PLAY`,
      },
      { channel: `game/${action.payload.gameId}` }
    );
  },
});

server.type<{
  type: string;
  payload: { fen: string; gameId: string; move: { from: string; to: string } };
}>('game/MOVE_PIECE', {
  access(ctx, action) {
    let game;

    try {
      game = findGameOrThrow(action.payload.gameId);
    } catch (e) {
      console.error(e);
      return false;
    }

    console.log(game);

    const isDark = game.b === ctx.userId;
    const isLight = game.w === ctx.userId;
    const isPlayer = isLight || isDark;

    console.log({ isDark, isLight, isPlayer });

    if (!isPlayer) {
      return false;
    }

    const { yours } = getSides(ctx, game);

    return (yours === 'w' && isLight) || (yours === 'b' && isDark);
  },
  resend(ctx, action) {
    return `game/${action.payload.gameId}`;
  },
  async process(ctx, action) {
    const game = findGameOrThrow(action.payload.gameId);

    if (game) {
      game.fen = action.payload.fen;
    }

    const opponentsId = getOpponentsUserId(ctx, game);

    if (!opponentsId) {
      return;
    }

    server.log.add(
      {
        type: 'game/TURN_FINISHED',
        payload: {
          move: action.payload.move,
          fen: game.fen,
          gameId: action.payload.gameId,
        },
      },
      { users: [opponentsId] }
    );
  },
});

server.type('game/TURN_FINISHED', {
  access() {
    return true;
  },
  resend(ctx, action) {
    return `game/${action.payload.gameId}`;
  },
  async process(ctx, action) {
    // noop
    // test
  },
});

server.listen();

function blackOrWhite(): Side {
  const num = rand();
  return num === 0 ? 'w' : 'b';
}

function rand() {
  return Math.round(Math.random());
}

function getSides(ctx: Context, game: Game): { yours: Side; opponents: Side } {
  let yourSide = Object.keys(game).find(
    (key) => (key === 'w' || key === 'b') && game[key as Side] === ctx.userId
  ) as Side;

  // Assign you a side
  if (!yourSide) {
    const opponents = game.w ? 'w' : 'b';
    const yours = opponents === 'w' ? 'b' : 'w';

    return { yours, opponents };
  }

  let opponentsSide: Side = yourSide === 'b' ? 'w' : 'b';

  return { yours: yourSide, opponents: opponentsSide };
}

function getOpponentsUserId(ctx: Context, game: Game) {
  const { opponents } = getSides(ctx, game);

  if (!opponents) {
    throw 'No side found, invalid state';
  }

  return game[opponents];
}
