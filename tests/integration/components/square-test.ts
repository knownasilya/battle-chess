import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component | square', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<Square/>`);

    assert.dom(this.element).containsText('');

    // Template block usage:
    await render(hbs`
      <Square @r={{0}} @c={{0}} @square="a1">
        template block text
      </Square>
    `);

    assert.dom(this.element).containsText('template block text');
  });
});
