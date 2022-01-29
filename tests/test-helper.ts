import Application from 'bchess/app';
import config from 'bchess/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP as any));

setup(QUnit.assert);

start();
