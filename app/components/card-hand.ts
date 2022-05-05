import Component from '@glimmer/component';
import cards from 'bchess/utils/cards';

interface CardHandArgs {
  cards: typeof cards;
  cardInPlay?: typeof cards[number];
  isMyTurn?: boolean;
}

export default class CardHand extends Component<CardHandArgs> {}
