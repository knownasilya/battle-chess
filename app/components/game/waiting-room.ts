import Component from '@glimmer/component';
import { Channel } from 'bchess/services/core';
import { inject as service } from '@ember/service';
import { useResource } from 'ember-resources';
import RouterService from '@ember/routing/router-service';
import { sync } from 'bchess/utils/sync';
import { Game } from 'shared';

interface WaitingRoomArgs {
  gameId: string;
}

export default class WaitingRoom extends Component<WaitingRoomArgs> {
  @service declare router: RouterService;

  channel = useResource(this, Channel, () => [`game/${this.args.gameId}`]);

  @sync('DETAILS')
  declare details?: Game;

  get opponentHere() {
    return this.details?.w && this.details.b;
  }
}
