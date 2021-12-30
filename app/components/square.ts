import Component from '@glimmer/component';

const COLUMNS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

interface SquareArgs {
  c: number;
  r: number;
  orientation: 'black' | 'white';
  selectedSquare?: string;
  highlightedSquares?: string[];
}

export default class Square extends Component<SquareArgs> {
  get square() {
    if (this.args.orientation === 'black') {
      return COLUMNS[7 - this.args.c] + (this.args.r + 1);
    }
    return COLUMNS[this.args.c] + (8 - this.args.r);
  }

  get color() {
    return this.args.c % 2 === this.args.r % 2 ? 'white' : 'black';
  }

  get bgColor() {
    return this.color === 'black' ? 'tan' : 'white';
  }

  get isSelected() {
    return this.args.selectedSquare === this.square;
  }

  get isHighlighted() {
    return this.args.highlightedSquares?.includes(this.square);
  }
}
