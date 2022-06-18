import cards from '../../lib/cards.mjs';

export type Side = 'w' | 'b';

export type RoomDetails = {
  w?: string;
  b?: string;
  turn: Side;
  fen?: string;
};

export type Game = {
  id: string;
  /**
   * ID of user
   */
  w?: string;
  /**
   * ID of user
   */
  b?: string;
  turn: Side;
  fen?: string;
};

export type User = {
  id: string;
  name?: string;
};

export type Card = typeof cards[number];
