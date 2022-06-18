import { Card, Game, User } from 'shared';

export const games: Game[] = [];
export const users: User[] = [];
export const hands: Map<Game, { w: Card[]; b: Card[] }> = new Map();

export const findGame = (id: string) => {
  const game = games.find((g) => g.id === id);

  return game;
};

export const findGameOrThrow = (id: string) => {
  const game = findGame(id);

  if (!game) {
    throw new Error(`Game with ID {${id}} not found`);
  }

  return game;
};

export const findUser = (id: string) => {
  const user = users.find((u) => u.id === id);

  return user;
};

export const findUserOrThrow = (id: string) => {
  const user = findUser(id);

  if (!user) {
    throw new Error(`User with ID {${id}} not found`);
  }

  return user;
};
