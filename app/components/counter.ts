import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
import Core from 'bchess/services/core';
import { sync } from 'bchess/utils/sync';

export default class Counter extends Component {
  @service('core') declare core: Core;

  @sync('INC', { defaultValue: 0 })
  declare counter: number;

  constructor(owner: object, args: object) {
    super(owner, args);

    this.core.subscribeChannel('counter', this);

    // this.core.client.type(
    //   'INC',
    //   (action: { type: 'INC'; value: number }, _meta: unknown) => {
    //     this.counter = action.value;
    //   }
    // );
  }

  increase = () =>
    this.core.client.sync({ type: 'INC', value: this.counter + 1 });
  increaseLocal = () =>
    this.core.client.log.add(
      { type: 'INC', value: this.counter + 1 },
      { tab: this.core.client.clientId }
    );
}
