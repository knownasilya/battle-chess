import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { Channel } from 'bchess/services/core';
import { useResource } from 'ember-resources';
import * as Chess from 'chess.js';
import { Card } from 'bchess/utils/cards';
import { Game, Side } from 'shared';

interface GameArgs {
  gameId: string;
}

export type ChessBoard = ({
  type: Chess.PieceType;
  color: Side;
} | null)[][];

export default class PlayGame extends Component<GameArgs> {
  channel = useResource(this, Channel, () => [`game/${this.args.gameId}`]);
  chess: Chess.ChessInstance;

  @tracked board: ChessBoard;
  @tracked turn: Side = 'w';
  @tracked cards?: Card[];
  @tracked cardInPlay?: Card;
  @tracked gameDetails?: Game;
  @tracked selectedSquare?: Chess.Square = undefined;
  @tracked hoveredSquare?: Chess.Square = undefined;
  @tracked highlightedSquares?: Chess.Square[] = undefined;

  constructor(owner: object, args: GameArgs) {
    super(owner, args);
    // @ts-expect-error known
    this.chess = new Chess();
    this.board = this.chess.board();

    this.channel.type<Game & { cards: Card[] }>('DETAILS', (action) => {
      const { cards, ...roomDetails } = action.payload;

      if (roomDetails.fen) {
        this.chess.load(roomDetails.fen);
        this.updateBoard();
      }

      this.cards = cards;
      this.gameDetails = roomDetails;
    });

    this.channel.globalType<{ move?: Chess.ShortMove; fen?: string }>(
      'game/TURN_FINISHED',
      (action) => {
        const move = action.payload.move;

        if (move) {
          this.chess.move(move);
        } else if (action.payload.fen) {
          this.chess.load(action.payload.fen);
        }
        this.updateBoard();
      }
    );

    this.channel.globalType('logux/undo', (action) => {
      if ((action as any).action.type === 'room/MOVE_PIECE') {
        this.chess.undo();
        this.updateBoard();
      }
    });

    this.channel.type<{ move?: Chess.ShortMove; fen?: string }>(
      'MOVE_PIECE',
      (action) => this.updateAfterMove(action.payload.move, action.payload.fen)
    );
  }

  get you() {
    const side: Side = this.gameDetails?.b === this.me ? 'b' : 'w';

    return {
      side,
      id: this.me,
      name: this.me,
    };
  }

  get opponent() {
    const side: Side = this.gameDetails?.b === this.me ? 'w' : 'b';

    return {
      side,
      id: this.gameDetails?.[side],
      name: this.gameDetails?.[side],
    };
  }

  get me() {
    return window.sessionStorage.getItem('userId');
  }

  get isMyTurn() {
    if (!this.gameDetails) {
      return false;
    }

    if (this.turn === 'b' && this.gameDetails.b === this.me) {
      return true;
    } else if (this.turn === 'w' && this.gameDetails.w === this.me) {
      return true;
    }

    return false;
  }

  @action
  selectSquare(piece: Chess.Piece | null, square: Chess.Square) {
    if (!this.isMyTurn) {
      return;
    }

    if (this.cardInPlay) {
      switch (this.cardInPlay?.id) {
        case 'remove-piece': {
          this.chess.remove(square);
          break;
        }
        case 'add-piece': {
          // Canceling the prompt returns `null` and stops playing this card
          let piece = undefined;

          while (piece === undefined || piece === 'k' || piece === 'q') {
            piece = window.prompt(
              'Which piece (except for royalty)?'
            ) as Chess.PieceType;
          }

          if (!piece) {
            this.cardInPlay = undefined;
            return;
          }

          this.chess.put({ type: piece, color: this.turn }, square);
          break;
        }
        default: {
          alert('unimplemented');
        }
      }

      this.channel.globalSync('game/MOVE_PIECE', {
        gameId: this.args.gameId,
        fen: this.chess.fen(),
      });
      this.selectedSquare = undefined;
      this.highlightedSquares = undefined;
      this.removeCard(this.cardInPlay);
      return;
    }

    // Make move if selecting a valid square
    if (this.selectedSquare && this.highlightedSquares?.includes(square)) {
      const move: Chess.ShortMove = { from: this.selectedSquare, to: square };
      const needsPromotion = isPromotion(this.chess, move);
      let promotion: 'n' | 'b' | 'r' | 'q' | undefined;

      if (needsPromotion) {
        promotion = window.prompt(
          'Enter piece code for promotion ("p" for Pawn, "n" for Knight, "b" for Bishop, "r" for Rook, "q" for Queen, "k" for King)'
        ) as 'n' | 'b' | 'r' | 'q' | undefined;
        move.promotion = promotion;
      }

      this.chess.move(move);
      this.channel.globalSync('game/MOVE_PIECE', {
        gameId: this.args.gameId,
        fen: this.chess.fen(),
        move,
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
  removeCard(card: Card) {
    if (!this.cards) {
      return;
    }

    this.cards.splice(this.cards.indexOf(card), 1);
    this.cards = [...this.cards];
    this.cardInPlay = undefined;
  }

  @action
  updateAfterMove(move?: Chess.ShortMove, fen?: string) {
    if (move) {
      this.chess.move(move);
    } else if (fen) {
      this.chess.load(fen);
    } else {
      this.chess.reset();
    }

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

const isPromotion = (chess: Chess.ChessInstance, move: Chess.ShortMove) =>
  chess
    .moves({ verbose: true })
    .filter(
      (m) => m.from === move.from && m.to === move.to && m.flags.includes('p')
    ).length > 0;
