import Component from '@glimmer/component';
import { Channel } from 'bchess/services/core';
import { sync } from 'bchess/utils/sync';
import { useResource } from 'ember-resources';

export default class Counter extends Component {
  channel = useResource(this, Channel, () => ['counter']);

  @sync('counter/INC', { defaultValue: 0 })
  declare counter: number;

  increase = () => this.channel.sync('INC', this.counter + 1);
  increaseLocal = () => this.channel.local('INC', this.counter + 1);
}
