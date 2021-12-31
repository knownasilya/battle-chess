import { helper } from '@ember/component/helper';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { Channel } from 'bchess/services/core';
import { sync } from 'bchess/utils/sync';
import * as Chess from 'chess.js';
import { useResource } from 'ember-resources';

interface BoardArgs {
  roomId: string;
  orientation: 'black' | 'white';
}

export default class Board extends Component<BoardArgs> {
  channel = useResource(this, Channel, () => [`room/${this.args.roomId}`]);

  @tracked selectedSquare?: Chess.Square = undefined;
  @tracked hoveredSquare?: Chess.Square = undefined;
  @tracked highlightedSquares?: Chess.Square[] = undefined;
  @tracked board: ({
    type: Chess.PieceType;
    color: 'b' | 'w';
  } | null)[][];

  emptyList = [...Array(8)];

  chess: Chess.ChessInstance;

  constructor(owner: object, args: BoardArgs) {
    super(owner, args);
    // @ts-expect-error known
    this.chess = new Chess();
    this.board = this.chess.board();

    this.channel.globalType('room/END_MOVE', (action) =>
      this.updateAfterMove((action.payload as { fen: string }).fen)
    );
  }

  @sync('room/ENTERED')
  declare roomDetails: { users: string[]; fen?: string; turn?: string };

  getPiece = helper(([row, col]: [row: number, col: number]) => {
    const board = this.board;
    const piece = board[row][col];

    return piece;
  });

  @action
  selectSquare(piece: Chess.Piece | null, square: Chess.Square) {
    // Make move if selecting a valid square
    if (this.selectedSquare && this.highlightedSquares?.includes(square)) {
      this.chess.move({ from: this.selectedSquare, to: square });
      this.channel.globalSync('room/END_MOVE', {
        roomId: this.args.roomId,
        fen: this.chess.fen(),
      });
    }

    this.highlightedSquares = getLegalMovesForPiece(this.chess, piece, square);

    if (this.selectedSquare === square) {
      this.selectedSquare = undefined;
      this.highlightedSquares = undefined;
    } else {
      this.selectedSquare = square;
    }
  }

  @action
  updateAfterMove(fen: string) {
    if (!fen) {
      this.chess.reset();
      this.updateBoard();
      return;
    }

    this.chess.load(fen);
    this.updateBoard();
  }

  updateBoard() {
    this.board = this.chess.board();
  }
}

const getLegalMovesForPiece = (
  game: Chess.ChessInstance,
  piece: Chess.Piece | null,
  square: string
) => {
  if (!piece) return [];

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
