import {jst}                 from 'jayesstee';
import {defs}                from '../defs.js';
import {RemoteComponentList,
        RemoteComponent}     from './common.js';
import {templates,
        formatters}      from '../templates.js';

export class Musicians extends RemoteComponentList {
  constructor() {
    super();
    this.component   = "musician";
    this.type        = Musician;
    this.allDisabled = false;

    this.fields = [
      {title: this.renderDisableAll(), name: "disabled"},
      {title: "Name",        name: "name"},
      {title: "Channel",     name: "channel_id"},
      {title: "Hits",        name: "hits"},
      {title: "Misses",      name: "misses"},
      {title: "Other",       name: "spontaneousNotes"},
      {title: "%",           name: "percent"},
      {title: "Ping",        name: "latency", format: formatters.formatLatency},
    ];

  }

  renderDisableAll() {
    return () => jst.$i({cn: `fa fa-${this.allDisabled?"":"check-"}square`,
                         events: {click: (e) => this.toggleAllMusicians(e)}}
                       );
  }

  register(message) {
    let musician = {
      name:             message.name,
      client_id:        message.client_id,
      hits:             message.hits             || 0,
      misses:           message.misses           || 0,
      spontaneousNotes: message.spontaneousNotes || 0,
      percent:          message.percent          || 0,
      latency:          message.latency          || 0
    };

    this.addItem(musician);
    
  }

  toggleAllMusicians() {
    this.allDisabled = this.allDisabled ? false : true;
    this.items.map(item => item.disable(this.allDisabled));
  }

  rxScoreUpdate(message) {
    let musician = this.itemMap[message.client_id];
    console.log("setting score", this, message);
    if (musician) {
      musician.setScore(message);
      this.sort();
    }
  }

  sortFunc(a, b) {
    return b.fields.percent - a.fields.percent;
  }

}


class Musician extends RemoteComponent {
  constructor(messaging, parent, me) {
    super(messaging, parent);
    this.fields   = Object.assign({}, me);
    this.disabled = false;

    this.fields.disabled = () => jst.$i(
      {events: {click: e => this.toggle()},
       cn: "fa " +
       (this.disabled ?
        "fa-square" :
        "fa-check-square")
      }
    );
  }

  toggle() {
    this.disabled = this.disabled ? false : true;
    this.refresh();
  }

  disable(val) {
    this.disabled = val;
    this.refresh();
  }

  setScore(message) {
    console.log("setting score", this, message);
    this.fields.hits              = message.hits;
    this.fields.misses            = message.misses;
    this.fields.spontaneousNotes  = message.spontaneousNotes;
    this.fields.percent           = message.percent;
    this.refresh();
  }
  
}
