import Component from '@glimmer/component';
import { Channel } from 'bchess/services/core';
import { inject as service } from '@ember/service';
import { useResource } from 'ember-resources';
import RouterService from '@ember/routing/router-service';

export default class Foyer extends Component {
  @service declare router: RouterService;

  channel = useResource(this, Channel, () => ['foyer']);

  constructor(owner: object, args: any) {
    super(owner, args);
    this.channel.globalType<{ gameId: string }>(
      'foyer/GAME_CREATED',
      (action) => {
        const { gameId } = action.payload;

        this.router.transitionTo('game.waiting-room', gameId);
      }
    );
  }

  addRoom = (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    this.channel.sync('ADD_ROOM', formData.get('name'));
    form.reset();
  };

  startGame = () => {
    const name = window.prompt('What is your name?');

    if (name) {
      this.channel.sync('START_GAME', { name });
    } else {
      window.alert('Please enter a your name to start a game.');
    }
  };

  joinGame = () => {
    const gameId = window.prompt('Enter the ID for the game you want to join');

    if (gameId) {
      this.router.transitionTo('game.join', gameId);
    } else {
      window.alert('Please enter an ID to join a game');
    }
  };
}
