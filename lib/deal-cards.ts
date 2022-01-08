import weighted from 'weighted';
import cards, { Card } from '../app/utils/cards';

interface WeightedCards {
  [k: Card['id']]: number;
}

export default function dealCards(numberOfCards = 5): Card[] {
  const cardsDealt: Card['id'][] = [];
  const cardWeights: WeightedCards = cards.reduce((weights, card) => {
    weights[card.id] = card.weight;
    return weights;
  }, {} as WeightedCards);

  while (cardsDealt.length < numberOfCards - 1) {
    const cardId = weighted(cardWeights) as Card['id'];

    cardsDealt.push(cardId);
  }

  return cardsDealt.map((id) => cards.find((c) => c.id === id));
}