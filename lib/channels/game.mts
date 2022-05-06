import { Server } from '@logux/server';
import { getOpponentsUserId, getSides } from '../utils.mjs';
import { findGameOrThrow, games, hands } from '../state.mjs';
import { Card } from 'shared';

/**
 * Most of the logic for the game is here
 */
export default function gameChannel(server: Server) {
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
      if (!game) {
        throw new Error(`Game with id ${ctx.params.id} doesn't exist`);
      }

      const { yours } = getSides(ctx, game);
      const hand = hands.get(game);

      return {
        type: `game/${ctx.params.id}/DETAILS`,
        payload: { ...game, cards: hand?.[yours] },
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
    payload: {
      fen: string;
      gameId: string;
      move: { from: string; to: string };
      cardIdPlayed?: Card['id'];
    };
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
        const { yours } = getSides(ctx, game);
        const hand = hands.get(game);
        const yourHand = hand?.[yours];

        // Update your hand
        if (yourHand && action.payload.cardIdPlayed) {
          const newHand = yourHand.filter(
            (card) => card.id !== action.payload.cardIdPlayed
          );
          hand[yours] = newHand;
        }
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
}
