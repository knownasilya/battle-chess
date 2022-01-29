import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | game/waiting-room', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const route = this.owner.lookup('route:game/waiting-room');
    assert.ok(route);
  });
});
