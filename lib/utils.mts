import { Context } from '@logux/server';
import { Game, Side } from 'shared';

export function blackOrWhite(): Side {
  const num = rand();
  return num === 0 ? 'w' : 'b';
}

function rand() {
  return Math.round(Math.random());
}

type Sides = { yours: Side; opponents: Side };

export function getSides(ctx: Context, game: Game): Sides {
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

export function getOpponentsUserId(ctx: Context, game: Game) {
  const { opponents } = getSides(ctx, game);

  if (!opponents) {
    throw 'No side found, invalid state';
  }

  return game[opponents];
}
