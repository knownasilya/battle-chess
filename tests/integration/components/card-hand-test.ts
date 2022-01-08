import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import cards from 'bchess/utils/cards';

module('Integration | Component | card-hand', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    this.set('cards', cards);
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

    await render(hbs`<CardHand @cards={{this.cards}} />`);

    assert.dom(this.element).containsText('The Axe');
  });
});
