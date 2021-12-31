import Component from '@glimmer/component';
import {
  createStorage,
  getValue,
  setValue,
  TrackedStorage,
} from 'ember-tracked-storage-polyfill';
import { Channel } from '../services/core';
interface Options {
  defaultValue?: unknown;
  key?: string;
  channelKey?: string;
  local?: boolean;
}
type Context = { channel: Channel } & Component & Record<string, unknown>;
type Action = { type: string } & Record<string, unknown>;

export function sync(
  action: string,
  { defaultValue, key, channelKey, local }: Options = {}
): any {
  return function (_target: Context, name: string) {
    const storageKey = `_${name}`;
    return {
      set(this: Context, value: unknown) {
        setValue(this[storageKey] as TrackedStorage<unknown>, value);
      },
      get(this: Context) {
        if (!this[storageKey]) {
          this[storageKey] = createStorage(defaultValue);

          if (local) {
            (this[channelKey || 'channel'] as Channel).type(
              action,
              (action: Action) => {
                this[name] = action[key ? key : 'payload'];
              }
            );
          } else {
            (this[channelKey || 'channel'] as Channel).globalType(
              action,
              (action: Action) => {
                this[name] = action[key ? key : 'payload'];
              }
            );
          }
        }

        return getValue(this[storageKey] as TrackedStorage<unknown>);
      },
    };
  };
}
