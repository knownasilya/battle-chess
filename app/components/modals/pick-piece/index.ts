import Component from '@glimmer/component';
import { PieceType } from 'chess.js';

interface ModalsPickPieceArgs {
  onSelect: (piece: PieceType) => void;
}

export default class ModalsPickPiece extends Component<ModalsPickPieceArgs> {}
