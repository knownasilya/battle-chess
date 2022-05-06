import { Game, User } from 'shared';

export const games: Game[] = [];
export const users: User[] = [];

export const findGameOrThrow = (id: string) => {
  const game = games.find((g) => g.id === id);

  if (!game) {
    throw new Error(`Game with ID {${id}} not found`);
  }

  return game;
};
