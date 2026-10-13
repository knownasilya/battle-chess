import { Server } from '@logux/server';
import { getOpponentsUserId, getSides, Sides } from '../utils.mjs';
import { GameModel, GameModelType, hands, UserModel } from '../state.mjs';
import { Card, Game } from 'shared';

/**
 * Most of the logic for the game is here
 */
export default function gameChannel(server: Server) {
  server.channel<{ id: string }, { game: GameModelType; sides: Sides }>(
    'game/:id',
    {
      async access(ctx) {
        const game = await GameModel.findByPk(ctx.params.id);

        if (!game) {
          throw new Error(`Game with id ${ctx.params.id} doesn't exist`);
        }

        const sides = getSides(ctx, game.toJSON());

        if (game[sides.yours] && game[sides.yours] !== ctx.userId) {
          return false;
        }

        ctx.data.sides = sides;
        ctx.data.game = game;

        return true;
      },

      async load(ctx) {
        const game = ctx.data.game.toJSON();
        const { yours } = getSides(ctx, game);
        const hand = hands.get(game.id);
        const usersInGame = await getGameUsers(game);

        return {
          type: `game/${ctx.params.id}/DETAILS`,
          payload: { ...game, cards: hand?.[yours], users: usersInGame },
        };
      },
    }
  );

  server.type<
    { type: string; payload: { gameId: string; name: string } },
    { game: GameModelType }
  >('game/JOIN', {
    async access(ctx, action) {
      const game = await GameModel.findByPk(action.payload.gameId);

      if (!game || (game?.b && game?.w)) {
        return false;
      }

      ctx.data.game = game;

      return true;
    },
    resend(ctx, action) {
      return `game/${action.payload.gameId}`;
    },
    async process(ctx, action) {
      const game = ctx.data.game;
      const joiningUser = await UserModel.findByPk(ctx.userId);

      if (joiningUser) {
        joiningUser.name = action.payload.name;
        await joiningUser.save();
      }

      const { yours, opponents } = getSides(ctx, game);
      console.log({ yours, opponents, game, userId: ctx.userId });
      game[yours] = ctx.userId;
      await game.save();

      ctx.sendBack({
        type: `game/${action.payload.gameId}/JOINED`,
      });

      const usersInGame = await getGameUsers(game);

      server.log.add(
        {
          type: `game/${action.payload.gameId}/DETAILS`,
          payload: { ...game.toJSON(), users: usersInGame },
        },
        { channel: `game/${action.payload.gameId}` }
      );
    },
  });

  server.type<
    { type: string; payload: { gameId: string } },
    { game: GameModelType }
  >('game/PLAY', {
    async access(ctx, action) {
      const game = await GameModel.findByPk(action.payload.gameId);

      if (!game || !game?.b || !game?.w) {
        return false;
      }

      ctx.data.game = game;

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

  server.type<
    {
      type: string;
      payload: {
        fen: string;
        gameId: string;
        move: { from: string; to: string };
        cardIdPlayed?: Card['id'];
      };
    },
    { game: GameModelType }
  >('game/MOVE_PIECE', {
    async access(ctx, action) {
      const game = await GameModel.findByPk(action.payload.gameId);

      if (!game) {
        return false;
      }

      const isDark = game.b === ctx.userId;
      const isLight = game.w === ctx.userId;
      const isPlayer = isLight || isDark;

      console.log({ isDark, isLight, isPlayer });

      if (!isPlayer) {
        return false;
      }

      const { yours } = getSides(ctx, game);

      ctx.data.game = game;

      return (yours === 'w' && isLight) || (yours === 'b' && isDark);
    },
    resend(ctx, action) {
      return `game/${action.payload.gameId}`;
    },
    async process(ctx, action) {
      const game = ctx.data.game;

      if (game) {
        game.fen = action.payload.fen;
        const { yours } = getSides(ctx, game);
        const hand = hands.get(game.id);
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

async function getGameUsers(game: Game) {
  const userIds = [game.w, game.b].filter((id) => !!id) as string[];
  const usersInGame = await Promise.all(
    userIds.map(async (id) => await UserModel.findByPk(id))
  );

  return usersInGame;
}
