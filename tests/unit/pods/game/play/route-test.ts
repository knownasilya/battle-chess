import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | game/play', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const route = this.owner.lookup('route:game/play');
    assert.ok(route);
  });
});
