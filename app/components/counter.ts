import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import Core from 'bchess/services/core';
import { sync } from 'bchess/utils/sync';

export default class Counter extends Component {
  @service('core') declare core: Core;

  @sync('counter/INC', { defaultValue: 0 })
  declare counter: number;

  constructor(owner: object, args: object) {
    super(owner, args);

    this.core.subscribeChannel('counter', this);
  }

  increase = () => this.core.sync('counter/INC', this.counter + 1);

  increaseLocal = () => this.core.local('counter/INC', this.counter + 1);
}
