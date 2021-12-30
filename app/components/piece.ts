import Component from '@glimmer/component';

interface PieceArgs {
  type: 'k' | 'q' | 'b' | 'r' | 'n' | 'p';
  color: 'b' | 'w';
}

// eslint-disable-next-line ember/no-empty-glimmer-component-classes
export default class Piece extends Component<PieceArgs> {}
