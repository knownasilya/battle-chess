import EmberRouter from '@ember/routing/router';
import config from 'bchess/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('room', { path: 'room/:id' });
  this.route('game', { path: 'game/:id' }, function () {
    this.route('waiting-room');
    this.route('play');
  });
});
