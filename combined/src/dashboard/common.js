import {jst}             from 'jayesstee';


export class Pinger {
  constructor(messaging, component) {
    this.pingTime    = 2000;
    this.pingsMissed = 0;
    this.component   = component;
    this.messaging   = messaging;
    this.pingTimer   = setInterval(() => {
      this.messaging.sendMessage(
        `orchestra/p2p/${component.fields.client_id}`,
        {msg_type: "ping"},
        (txMessage, rxMessage) => {
          this.handlePingResponse(component, txMessage, rxMessage);
        }, 1900);
    }, this.pingTime); 

  }

  handlePingResponse(component, txMessage, rxMessage) {
    let latency;

    if (rxMessage.status === "timeout") {
      this.pingsMissed++;
      latency = "?";
    }
    else {
      this.pingsMissed = 0;
      latency = this.messaging.getTime() - txMessage.current_time;
    }
    
    this.component.setLatency(latency);

    if (this.pingsMissed > 10) {
      // Remove the component after ten non-replies
      this.component.remove();
    }
  }

  stop() {
    clearInterval(this.pingTimer);
  }
  
}


export class RemoteComponentList extends jst.Object {
  constructor(dashboard) {
    super();
    this.dashboard = dashboard;
    this.items     = [];
    this.itemMap   = {};
  }

  cssLocal() {
    return {
      stateActive$c: {
        fontWeight: "bold",
        color:      "green"
      },
      stateInactive$c: {
        color:      "#888"
      },
      stateIdle$c: {
        color:      "#000"
      }
    };
  }

  render() {
    return jst.$table(
          jst.$thead(
            jst.$tr(
              this.fields.map(field => jst.$th({cn: "-th"}, field.title))
            )
          ),
          jst.$tbody(
            this.items.map(
              m => jst.$tr(
                this.fields.map(field => jst.$td(
                  {cn: `-state${m.state ? m.state : ""}`},
                  field.format ?
                    field.format(m.fields[field.name]) :
                    m.fields[field.name]))
              )
            )
          )
        );
  }

  setMessaging(messaging) {
    this.messaging = messaging;
  }

  setAllState(state) {
    for (let item of this.items) {
      item.state = state;
    }
  }

  addItem(rawItem) {
    // remove item if already there
    let item = new (this.type)(this.messaging, this, rawItem);

    if (typeof(rawItem.client_id) !== "undefined") {
      let toRemove = this.items.find(val => val.fields.client_id === item.fields.client_id);
      if (toRemove) {
        toRemove.remove();
      }
    }

    // add it
    this.itemMap[item.fields.client_id] = item;
    this.items.push(item);
    this.sort();
    this.refresh();
  }

  removeItem(item) {
    let index = this.items.findIndex(val => val.fields.client_id === item.fields.client_id);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
    this.refresh();
  }

  sort() {
    if (this.sortFunc) {
      this.items = this.items.sort((a,b) => this.sortFunc(a,b));
      this.refresh();
    }
  }

}


export class RemoteComponent {
  constructor(messaging, parent, me) {
    this.fields    = Object.assign({}, me);
    this.parent    = parent;
    this.messaging = messaging;
    this.pinger    = new Pinger(messaging, this);
  }

  refresh() {
    this.parent.refresh();
  }

  setLatency(latency) {
    this.fields.latency = latency;
    this.refresh();
  }

  remove() {
    this.pinger.stop();
    delete this.pinger;
    this.parent.removeItem(this);
  }

  setState(state) {
    this.state = state;
  }

}

export class LocalComponent {
  constructor(messaging, parent, me) {
    this.messaging = messaging;
    this.fields    = Object.assign({}, me);
    this.parent    = parent;
  }

  refresh() {
    this.parent.refresh();
  }

  remove() {
    this.parent.removeItem(this);
  }

  setState(state) {
    this.state = state;
  }

}
