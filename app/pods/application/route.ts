import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import Core from 'bchess/services/core';
import shortUUID from 'short-uuid';

export default class Application extends Route {
  @service declare core: Core;

  beforeModel() {
    this.core.setup({ userId: getUserId() });
  }
}

function getUserId() {
  let userId = window.sessionStorage.getItem('userId');

  if (!userId) {
    userId = shortUUID.generate().toString();
    window.sessionStorage.setItem('userId', userId);
  }

  return userId;
}
