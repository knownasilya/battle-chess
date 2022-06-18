import Component from '@glimmer/component';
import { Channel } from 'bchess/services/core';
import { inject as service } from '@ember/service';
import { useResource } from 'ember-resources';
import RouterService from '@ember/routing/router-service';
import { sync } from 'bchess/utils/sync';
import { Game, User } from 'shared';
import { helper } from '@ember/component/helper';

interface WaitingRoomArgs {
  gameId: string;
}

export default class WaitingRoom extends Component<WaitingRoomArgs> {
  @service declare router: RouterService;

  channel = useResource(this, Channel, () => [`game/${this.args.gameId}`]);

  @sync('DETAILS', { local: true })
  declare gameDetails?: Game & { users: [User, User] };

  constructor(owner: object, args: any) {
    super(owner, args);
    this.channel.type('PLAY', () => {
      this.router.transitionTo('game.play', this.args.gameId);
    });
  }

  get hasOpponent() {
    return this.gameDetails?.w && this.gameDetails.b;
  }

  get matchedOpponents() {
    if (!this.gameDetails) {
      return;
    }

    return `${this.gameDetails.users[0]?.name} vs ${this.gameDetails.users[1]?.name}`;
  }

  joinUrl = helper(() =>
    new URL(
      this.router.urlFor('game.join', this.args.gameId),
      window.location.href
    ).toString()
  );

  play = () => {
    this.channel.globalSync('game/PLAY', { gameId: this.args.gameId });
  };
}
