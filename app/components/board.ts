import { helper } from '@ember/component/helper';
import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { Channel } from 'bchess/services/core';
import * as Chess from 'chess.js';
import { useResource } from 'ember-resources';

interface BoardArgs {
  roomId: string;
  orientation: 'black' | 'white';
}

interface RoomDetails {
  w: string;
  b: string;
  fen?: string;
  turn: 'w' | 'b';
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
  @tracked turn: 'b' | 'w' = 'w';
  @tracked roomDetails?: RoomDetails = undefined;

  emptyList = [...Array(8)];

  chess: Chess.ChessInstance;

  constructor(owner: object, args: BoardArgs) {
    super(owner, args);
    // @ts-expect-error known
    this.chess = new Chess();
    this.board = this.chess.board();

    this.channel.globalType<{ move: Chess.ShortMove }>(
      'room/MOVE_PIECE',
      (action) => this.updateAfterMove(action.payload.move)
    );
    this.channel.globalType<RoomDetails>('room/ENTERED', (action) => {
      const fen = action.payload.fen;

      if (fen) {
        this.chess.load(fen);
        this.updateBoard();
      }

      this.roomDetails = action.payload;
    });
    this.channel.globalType<{ move: Chess.ShortMove }>(
      'room/TURN_FINISHED',
      (action) => {
        const move = action.payload.move;

        if (move) {
          this.chess.move(move);
          this.updateBoard();
        }
      }
    );
    this.channel.globalType('logux/undo', (action) => {
      if ((action as any).action.type === 'room/MOVE_PIECE') {
        this.chess.undo();
        this.updateBoard();
      }
    });
  }

  getPiece = helper(([row, col]: [row: number, col: number]) => {
    const board = this.board;
    const piece = board[row][col];

    return piece;
  });

  get me() {
    return window.location.search.replace('?', '');
  }

  get isMyTurn() {
    if (!this.roomDetails) {
      return false;
    }

    if (this.turn === 'b' && this.roomDetails.b === this.me) {
      return true;
    } else if (this.turn === 'w' && this.roomDetails.w === this.me) {
      return true;
    }

    return false;
  }

  @action
  selectSquare(piece: Chess.Piece | null, square: Chess.Square) {
    if (!this.isMyTurn) {
      return;
    }
    // Make move if selecting a valid square
    if (this.selectedSquare && this.highlightedSquares?.includes(square)) {
      this.chess.move({ from: this.selectedSquare, to: square });
      this.channel.globalSync('room/MOVE_PIECE', {
        roomId: this.args.roomId,
        fen: this.chess.fen(),
        move: { from: this.selectedSquare, to: square },
      });
      this.selectedSquare = undefined;
      this.highlightedSquares = undefined;
      return;
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
  updateAfterMove(move: Chess.ShortMove) {
    if (!move) {
      this.chess.reset();
      this.updateBoard();
      return;
    }

    this.chess.move(move);
    this.updateBoard();
  }

  updateBoard() {
    this.board = this.chess.board();
    this.turn = this.chess.turn();
  }
}

const getLegalMovesForPiece = (
  game: Chess.ChessInstance,
  piece: Chess.Piece | null,
  square: string
) => {
  if (!piece) return [];

  return game.moves({ square, verbose: true }).map((move) => move.to);
};
