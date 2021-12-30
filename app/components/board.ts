import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class Board extends Component {
  @tracked selectedSquare?: string = undefined;

  emptyList = [...Array(8)];
}
