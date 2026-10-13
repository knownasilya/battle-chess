import { Context } from '@logux/server';
import { Attributes } from 'sequelize/types/model';
import { Game, Side } from 'shared';
import { GameModelType } from './state.mjs';

export function blackOrWhite(): Side {
  const num = rand();
  return num === 0 ? 'w' : 'b';
}

function rand() {
  return Math.round(Math.random());
}

export type Sides = { yours: Side; opponents: Side };

export function getSides(
  ctx: Context,
  game: Game | Attributes<GameModelType>
): Sides {
  // Read sides directly, Sequelize instances expose them as prototype getters
  const yourSide = (['w', 'b'] as const).find(
    (side) => game[side] === ctx.userId
  );

  // Assign you a side
  if (!yourSide) {
    const opponents = game.w ? 'w' : 'b';
    const yours = opponents === 'w' ? 'b' : 'w';

    return { yours, opponents };
  }

  let opponentsSide: Side = yourSide === 'b' ? 'w' : 'b';

  return { yours: yourSide, opponents: opponentsSide };
}

export function getOpponentsUserId(ctx: Context, game: Game) {
  const { opponents } = getSides(ctx, game);

  if (!opponents) {
    throw 'No side found, invalid state';
  }

  return game[opponents];
}
