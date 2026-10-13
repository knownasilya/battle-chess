import { Card, Game, Side, User } from 'shared';
import {
  Sequelize,
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
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

export interface GameModelType
  extends Model<
    InferAttributes<GameModelType>,
    InferCreationAttributes<GameModelType>
  > {
  // Some fields are optional when calling GameModel.create() or GameModel.build()
  id: string;
  turn: Side;
  w: CreationOptional<string>;
  b: CreationOptional<string>;
  fen: CreationOptional<string>;
}

export const GameModel = sequelize.define<GameModelType>('Game', {
  id: { type: DataTypes.STRING, primaryKey: true },
  w: { type: DataTypes.STRING, allowNull: true },
  b: { type: DataTypes.STRING, allowNull: true },
  turn: { type: DataTypes.ENUM<Side>('w', 'b') },
  fen: { type: DataTypes.STRING, allowNull: true },
});

UserModel.sync({ alter: true });
GameModel.sync({ alter: true });

export const hands: Map<Game['id'], { w: Card[]; b: Card[] }> = new Map();
