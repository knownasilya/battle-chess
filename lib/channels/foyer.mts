import { Server } from '@logux/server';
import shortUUID from 'short-uuid';
import { Game } from 'shared';
import { blackOrWhite } from '../utils.mjs';
import { games, hands, UserModel, users } from '../state.mjs';
import dealCards from '../deal-cards.mjs';

/**
 * The foyer is the place you enter when you first open the app,
 * before you enter any games.
 */
export default function foyerChannel(server: Server) {
  server.channel('foyer', {
    access() {
      return true;
    },

    async load() {
      // Load initial state when client subscribing to the channel.
    },
  });

  /**
   * Create a new game
   * */
  server.type<{ type: string; payload: { name: string } }>('foyer/START_GAME', {
    access() {
      return true;
    },
    resend() {
      return 'foyer';
    },
    async process(ctx, action) {
      const id = shortUUID.generate().toString();
      const side = blackOrWhite();
      const turn = blackOrWhite();
      const game: Game = {
        id,
        [side]: ctx.userId,
        turn,
      };

      hands.set(game, { w: dealCards(), b: dealCards() });
      games.push(game);

      // Update user

      const user = await UserModel.findByPk(ctx.userId);
      if (user) {
        user.name = action.payload.name;
        await user.save();
      }

      ctx.sendBack({ type: 'foyer/GAME_CREATED', payload: { gameId: id } });
    },
  });
}
