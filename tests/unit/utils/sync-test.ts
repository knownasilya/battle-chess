import { sync } from 'bchess/utils/sync';
import { module, test } from 'qunit';

module('Unit | Utility | sync', function () {
  // Replace this with your real tests.
  test('it works', function (assert) {
    const result = sync('INC');
    assert.ok(result);
  });
});
