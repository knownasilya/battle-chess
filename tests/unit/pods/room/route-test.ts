import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | room', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const route = this.owner.lookup('route:room');
    assert.ok(route);
  });
});
