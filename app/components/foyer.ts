import Component from '@glimmer/component';
import { Channel } from 'bchess/services/core';
import { sync } from 'bchess/utils/sync';
import { useResource } from 'ember-resources';

export default class Foyer extends Component {
  channel = useResource(this, Channel, () => ['foyer']);

  @sync('LIST_ROOMS')
  declare rooms: string[];

  addRoom = (e: SubmitEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    this.channel.sync('ADD_ROOM', formData.get('name'));
    form.reset();
  };
}
