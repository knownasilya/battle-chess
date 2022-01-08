import { helper } from '@ember/component/helper';
import Component from '@glimmer/component';
import * as Chess from 'chess.js';
import { ChessBoard } from './game';

interface BoardArgs {
  board: ChessBoard;
  orientation?: 'black' | 'white';
  selectedSquare?: Chess.Square;
  hoveredSquare?: Chess.Square;
  highlightedSquares?: Chess.Square[];
}

export default class Board extends Component<BoardArgs> {
  emptyList = [...Array(8)];

  getPiece = helper(([row, col]: [row: number, col: number]) => {
    const board = this.args.board;
    const piece = board[row][col];

    return piece;
  });
}
