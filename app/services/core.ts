import Service from '@ember/service';
// @ts-expect-error notypes
import { registerDestructor } from '@ember/destroyable';
import { CrossTabClient, badge, badgeEn, log } from '@logux/client';
import { badgeStyles } from '@logux/client/badge/styles';
import { loguxSubscribe, loguxUnsubscribe } from '@logux/actions';
import Component from '@glimmer/component';
import { getOwner } from '@ember/application';
import { Resource } from 'ember-resources';
import { helper } from '@ember/component/helper';
import { ClientActionListener } from '@logux/client/client';
import Config from '../config/environment';

type Owner = { lookup: <T>(value: string) => T };

export class Channel extends Resource {
  owner: Owner;
  channel: string;

  constructor(
    owner: Owner,
    args: { positional?: [channel: string]; named?: Record<string, unknown> },
    previous?: {
      args: { positional?: [channel: string]; named?: Record<string, unknown> };
    }
  ) {
    super(owner, args, previous);
    const channel = args.positional?.[0];

    if (!channel) {
      throw new Error('@channel=<string> is required');
    }

    this.channel = channel;
    this.owner = owner;

    if (!previous) {
      this.core.subscribeChannel(this.channel);
    } else {
      const previousChannel = previous.args.positional?.[0];

      // update
      if (previousChannel) {
        this.core.unsubscribeChannel(previousChannel);
      }

      this.core.subscribeChannel(this.channel);
    }

    registerDestructor(this, () => {
      this.core.unsubscribeChannel(this.channel);
    });
  }

  get core(): Core {
    return this.owner.lookup<Core>('service:core');
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
      server: Config.APP?.LOGUX_URL || 'ws://127.0.0.1:31337',
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
