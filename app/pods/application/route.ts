import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import Core from 'bchess/services/core';

export default class Application extends Route {
  @service declare core: Core;

  beforeModel() {
    this.core.setup({ userId: 'a' });
  }
}
