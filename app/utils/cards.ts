const cards = [
  // {
  //   id: 'skip-turn',
  //   name: 'Skip Turn',
  //   description:
  //     'Skip the opponents next turn, effectively giving you two turns.',
  //   afterPlay: 'continue-turn',
  // },
  // {
  //   id: 'promote-pawn',
  //   name: 'Promote Pawn',
  //   description: 'Promote a pawn of your choosing.',
  //   afterPlay: 'end-turn',
  // },
  {
    id: 'add-piece',
    name: 'Backup',
    description: 'Add any piece to the board',
    afterPlay: 'end-turn',
    weight: 0.2,
  },
  {
    id: 'remove-piece',
    name: 'The Axe',
    description: 'Remove any piece off the board',
    afterPlay: 'end-turn',
    weight: 0.8,
  },
];

export default cards;

export type Card = typeof cards[number];
