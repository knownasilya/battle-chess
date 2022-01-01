import Service from '@ember/service';
import { registerDestructor } from '@ember/destroyable';
import { CrossTabClient, badge, badgeEn, log } from '@logux/client';
import { badgeStyles } from '@logux/client/badge/styles';
import { loguxSubscribe, loguxUnsubscribe } from '@logux/actions';
import Component from '@glimmer/component';
import { getOwner } from '@ember/application';
import { ArgsWrapper, Resource } from 'ember-resources';
import { helper } from '@ember/component/helper';
import { ClientActionListener } from '@logux/client/client';
import { Action } from '@logux/server';

export class Channel extends Resource {
  owner: any;
  channel: string;

  constructor(
    owner: any,
    args: { positional: [channel: string] },
    previous?: any
  ) {
    super(owner, args as ArgsWrapper, previous);
    this.channel = args.positional[0];
    this.owner = owner;

    if (!previous) {
      this.core.subscribeChannel(this.channel);
    } else {
      // update
      this.core.unsubscribeChannel(previous.args.positional[0]);
      this.core.subscribeChannel(this.channel);
    }

    registerDestructor(this, () => {
      this.core.unsubscribeChannel(this.channel);
    });
  }

  get core(): Core {
    return this.owner.lookup('service:core');
  }

  sync(type: string, payload?: unknown) {
    this.core.sync(`${this.channel}/${type}`, payload);
  }

  globalSync(type: string, payload?: unknown) {
    this.core.sync(type, payload);
  }

  local(type: string, payload?: unknown) {
    this.core.local(`${this.channel}/${type}`, payload);
  }

  type(
    type: string,
    listener: ClientActionListener<{ type: string; payload?: unknown }>
  ) {
    this.core.client.type(`${this.channel}/${type}`, listener);
  }

  globalType<T>(
    type: string,
    listener: ClientActionListener<{ type: string; payload: T }>
  ) {
    this.core.client.type<{ type: string; payload: T }>(type, listener);
  }

  syncType = helper(
    ([type, payload]: [type: string, payload?: unknown]) =>
      () =>
        this.sync(type, payload)
  );

  localType = helper(
    ([type, payload]: [type: string, payload?: unknown]) =>
      () =>
        this.local(type, payload)
  );
}

export class Channel2 {
  name: string;
  instance: Component;

  constructor(name: string, instance: Component) {
    this.name = name;
    this.instance = instance;
  }

  get core(): Core {
    return getOwner(this.instance).lookup('service:core');
  }

  sync(type: string, payload?: unknown) {
    this.core.sync(`${this.name}/${type}`, payload);
  }

  local(type: string, payload?: unknown) {
    this.core.local(`${this.name}/${type}`, payload);
  }
}

export default class Core extends Service {
  declare client: CrossTabClient;

  setup({ userId, token }: { userId: string; token?: string }) {
    const client = new CrossTabClient({
      subprotocol: '1.0.0',
      server: 'ws://127.0.0.1:31337',
      userId,
      token,
    });

    badge(client, { messages: badgeEn, styles: badgeStyles });
    log(client);

    client.start();

    this.client = client;
  }

  subscribeChannel(channel: string) {
    this.client.sync(loguxSubscribe({ channel })).then(() => {
      console.log('subscribed');
    });
  }

  unsubscribeChannel(channel: string) {
    this.client.sync(loguxUnsubscribe({ channel })).then(() => {
      console.log('unsubscribed');
    });
  }

  sync(type: string, payload?: unknown) {
    this.client.sync({ type, payload });
  }

  local(type: string, payload?: unknown) {
    this.client.log.add({ type, payload }, { tab: this.client.clientId });
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    core: Core;
  }
}
