export type RoomDetails = {
  w?: string;
  b?: string;
  turn: 'b' | 'w';
  fen?: string;
};

export type Game = {
  id: string;
  w?: string;
  b?: string;
  turn: 'b' | 'w';
  fen?: string;
};

export type User = {
  id: string;
  name?: string;
};
