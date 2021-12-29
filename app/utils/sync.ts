import {
  createStorage,
  getValue,
  setValue,
  TrackedStorage,
} from 'ember-tracked-storage-polyfill';
import Core from '../services/core';
interface Options {
  defaultValue?: unknown;
  key?: string;
}
type Context = { core: Core } & Record<string, unknown>;
type Action = { type: string } & Record<string, unknown>;

export function sync(action: string, { defaultValue, key }: Options = {}): any {
  return function (_target: Context, name: string) {
    const storageKey = `_${name}`;
    return {
      set(this: Context, value: unknown) {
        setValue(this[storageKey] as TrackedStorage<unknown>, value);
      },
      get(this: { core: Core } & Record<string, unknown>) {
        if (!this[storageKey]) {
          this[storageKey] = createStorage(defaultValue);
          this.core.client.type(action, (action: Action, _meta: unknown) => {
            this[name] = action[key ? key : 'payload'];
          });
        }

        return getValue(this[storageKey] as TrackedStorage<unknown>);
      },
    };
  };
}
