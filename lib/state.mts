import { Card, Game, User } from 'shared';
import {
  Sequelize,
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Optional,
} from 'sequelize';

const sequelize = new Sequelize('sqlite::memory:');

interface UserModel
  extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  id: string;
  name: CreationOptional<string>;
}

export const UserModel = sequelize.define<UserModel>('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: true },
});

UserModel.sync();

export const games: Game[] = [];
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
