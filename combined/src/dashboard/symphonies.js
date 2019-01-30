import {jst}                 from 'jayesstee';
import {defs}                from '../defs.js';
import {RemoteComponentList,
        RemoteComponent}     from './common.js';
import {templates,
        formatters}          from '../templates.js';

export class Symphonies extends RemoteComponentList {
  constructor() {
    super();
    this.component = "symphony";
    this.type      = Symphony;

    this.fields = [
      {title: "Name",    name: "name"},
      {title: "Ping",    name: "latency", format: formatters.formatLatency},
    ];
  }

  register(message) {

    let symphony = {
      name:      message.name,
      client_id: message.client_id,
      latency:   0
    };

    this.addItem(symphony);

  }

}


class Symphony extends RemoteComponent {
  constructor(messaging, parent, me) {
    super(messaging, parent, me);
  }
}
