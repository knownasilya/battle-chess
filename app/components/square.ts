import Component from '@glimmer/component';

const COLUMNS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

interface SquareArgs {
  c: number;
  r: number;
  orientation: 'black' | 'white';
}

export default class Square extends Component<SquareArgs> {
  get square() {
    const square =
      this.args.orientation === 'black'
        ? COLUMNS[7 - this.args.c] + (this.args.r + 1)
        : COLUMNS[this.args.c] + (8 - this.args.r);
    return square;
  }

  get color() {
    const color = this.args.c % 2 === this.args.r % 2 ? 'white' : 'black';
    return color;
  }

  get bgColor() {
    return this.color === 'black' ? 'tan' : 'lighttan';
  }
}
