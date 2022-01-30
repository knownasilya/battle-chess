import Component from '@glimmer/component';
import { Channel } from 'bchess/services/core';
import { inject as service } from '@ember/service';
import { useResource } from 'ember-resources';
import RouterService from '@ember/routing/router-service';

interface JoinGameArgs {
  gameId: string;
}

export default class JoinGame extends Component<JoinGameArgs> {
  @service declare router: RouterService;

  channel = useResource(this, Channel, () => [`game/${this.args.gameId}`]);

  constructor(owner: object, args: any) {
    super(owner, args);
    this.channel.type('JOINED', () => {
      this.router.transitionTo('game.waiting-room', this.args.gameId);
    });
  }

  joinGame = (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    this.channel.globalSync('game/JOIN', { id: this.args.gameId, ...data });
    form.reset();
  };
}
