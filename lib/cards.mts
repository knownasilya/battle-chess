const cards = [
  {
    id: 'skip-turn',
    name: 'Skip Turn',
    description:
      'Skip the opponents next turn, effectively giving you two turns.',
    afterPlay: 'continue-turn',
    weight: 0.1,
  },
  {
    id: 'promote-pawn',
    name: 'Promote Pawn',
    description: 'Promote a pawn of your choosing.',
    afterPlay: 'end-turn',
    weight: 0.1,
  },
  {
    id: 'add-piece',
    name: 'Backup',
    description: 'Add any piece to the board',
    afterPlay: 'end-turn',
    weight: 0.1,
  },
  {
    id: 'remove-piece',
    name: 'The Axe',
    description: 'Remove any piece off the board',
    afterPlay: 'end-turn',
    weight: 0.3,
  },
  {
    id: 'reveal-card',
    name: 'Reveal Card',
    description: 'Pick a card that you want to see from your opponents hand',
    afterPlay: 'end-turn',
    weight: 0.2,
  },
  {
    id: 'lock-piece',
    name: 'Ball and Chain',
    description:
      'Pick one of your opponents pieces which will not be able to move on their next turn',
    afterPlay: 'end-turn',
    weight: 0.1,
  },
  {
    id: 'quicksand',
    name: 'Quicksand',
    description:
      'Select any square. The selected square will have quicksand and any piece still on that square on the 4th turn will be lost.',
    weight: 0.2,
  },
  {
    id: 'fog-of-war',
    name: 'Fog of War',
    description:
      "After playing this card a fog will overcome your opponent and they won't be able to see your move untill after their turn ends.",
    afterPlay: 'continue-turn',
    weight: 0.1,
  },
];

export default cards;
