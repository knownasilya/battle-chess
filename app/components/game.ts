import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import cards, { Card } from 'bchess/utils/cards';

interface GameArgs {}

export default class Game extends Component<GameArgs> {
  @tracked cards = [...cards];
  @tracked cardInPlay?: Card;

  @action
  removeCard(card: Card) {
    this.cards.splice(this.cards.indexOf(card), 1);
    this.cards = [...this.cards];
  }
}
