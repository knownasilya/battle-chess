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
}
type Context = { channel: Channel } & Record<string, unknown>;
type Action = { type: string } & Record<string, unknown>;

export function sync(action: string, { defaultValue, key }: Options = {}): any {
  return function (_target: Context, name: string) {
    const storageKey = `_${name}`;
    return {
      set(this: Context, value: unknown) {
        setValue(this[storageKey] as TrackedStorage<unknown>, value);
      },
      get(this: Context) {
        if (!this[storageKey]) {
          this[storageKey] = createStorage(defaultValue);
          this.channel.type(action, (action: Action) => {
            this[name] = action[key ? key : 'payload'];
          });
        }

        return getValue(this[storageKey] as TrackedStorage<unknown>);
      },
    };
  };
}
