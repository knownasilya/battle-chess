import Route from '@ember/routing/route';

interface Params {
  id: string;
}

export default class Room extends Route {
  // normal class body definition here
  model({ id }: Params) {
    return { id };
  }
}
