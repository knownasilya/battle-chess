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
    id: 'remove-piece',
    name: 'The Axe',
    description: 'Remove any piece off the board',
    afterPlay: 'end-turn',
  },
];

export default cards;

export type Card = typeof cards[number];
