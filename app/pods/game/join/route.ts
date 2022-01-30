import Route from '@ember/routing/route';
import { Params as GameParams } from '../route';

export default class GameJoin extends Route<{ id: string }> {
  model() {
    const { id } = this.paramsFor('game') as GameParams;

    return { id };
  }
}
