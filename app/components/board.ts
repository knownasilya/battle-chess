import { helper } from '@ember/component/helper';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import * as Chess from 'chess.js';

export default class Board extends Component {
  @tracked selectedSquare?: string = undefined;

  emptyList = [...Array(8)];

  // @ts-expect-error known
  chess: Chess.ChessInstance = new Chess();

  get board() {
    return this.chess.board();
  }

  getPiece = helper(([row, col]: [row: number, col: number]) => {
    const board = this.board;
    const piece = board[row][col];

    return piece;
  });
}
