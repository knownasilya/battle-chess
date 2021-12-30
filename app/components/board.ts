import { helper } from '@ember/component/helper';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import * as Chess from 'chess.js';

export default class Board extends Component {
  @tracked selectedSquare?: string = undefined;
  @tracked hoveredSquare?: string = undefined;
  @tracked highlightedSquares?: string[] = undefined;

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

  @action
  selectSquare(piece: Chess.Piece | null, square: string) {
    if (this.selectedSquare === square) {
      this.selectedSquare = undefined;
      this.highlightedSquares = undefined;
    } else {
      this.selectedSquare = square;

      if (piece) {
        this.highlightedSquares = getLegalMovesForPiece(
          this.chess,
          piece,
          square
        );
      } else {
        this.highlightedSquares = undefined;
      }
    }
  }
}

const getLegalMovesForPiece = (
  game: Chess.ChessInstance,
  piece: Chess.Piece,
  square: string
) => {
  return game
    .moves({ verbose: true })
    .filter((move) => {
      return (
        move.from === square &&
        move.piece === piece.type &&
        move.color === piece.color
      );
    })
    .map((move) => move.to);
};
