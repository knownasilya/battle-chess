import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import Core, { Channel } from 'bchess/services/core';
import { sync } from 'bchess/utils/sync';

export default class Counter extends Component {
  @service('core') declare core: Core;

  @sync('counter/INC', { defaultValue: 0 })
  declare counter: number;

  channel: Channel;

  constructor(owner: object, args: object) {
    super(owner, args);

    this.channel = this.core.subscribeChannel('counter', this);
  }

  increase = () => this.channel.sync('INC', this.counter + 1);
  increaseLocal = () => this.channel.local('INC', this.counter + 1);
}
