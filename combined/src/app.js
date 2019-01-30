import {jst}       from 'jayesstee';
import {jstform}   from 'jayesstee.form';
import Navigo      from 'navigo';
import {defs}      from './defs.js';
import {Spinner}   from './spinner.js';
import {Body}      from './body.js';

export class App extends jst.Object {
  constructor() {
    super();
    this.eventHandlers = {};
    this.router        = new Navigo(null, true);
    this.body          = new Body(this);
    this.spinner       = new Spinner(this);

    jstform.setDefaults({
      color: {
        textLight:       "#fff",
        textDark:        defs.global.color.primary,
        backgroundLight: defs.global.color.primary.lighten(1.6),
        backgroundDark:  defs.global.color.primary,
        highlight:       defs.global.color.primary.lighten(1.6)
      },
      font: {
        size:   defs.global.font.formLabelSize,
        family: defs.global.font.family
      },
      label: {
        position: "left"
      }
    });

    this.router.resolve();
    
  }
  
  cssGlobal() {
    return {
      body: {
        fontFamily:      "'Roboto Slab', serif",
        fontSize$pt:     16,
        backgroundColor: "white",
        margin$px:       0,
        padding$px:      0
      },
      busy$c: {
        position: "absolute",
        top$vh: 30,
        margin: "auto",
      }
    };
  }
  
  render() {
    return jst.$div(
      {id: "app"},
      this.body,
      this.spinner
    );
  }

  event(name, ...data) {
    if (this.eventHandlers[name]) {
      for (let handler of this.eventHandlers[name]) {
        handler.apply(this, data);
      }
    }
  }

  on(name, func) {
    if (!this.eventHandlers[name]) {
      this.eventHandlers[name] = [];
    }
    this.eventHandlers[name].push(func);
  }

  startBusy(text) {
    this.spinner.start(text);
  }

  stopBusy() {
    this.spinner.stop();
  }

  navigate(opts) {
    let {url, params} = opts;
    let queryParts = [];

    for (let paramName of Object.keys(params || {})) {
      queryParts.push(`${encodeURIComponent(paramName)}=${encodeURIComponent(params[paramName])}`);
    }

    if (!url) {
      url = this.router.lastRouteResolved().url;
    }
    
    if (queryParts.length) {
      url += `?${queryParts.join("&")}`;
    }

    this.router.navigate(url);
    
  }
    
}
