import {jst}             from 'jayesstee';
import {defs}            from '../defs.js';

export class Status extends jst.Object {
  constructor(dashboard) {
    super();
    this.component  = "status";
    this.type       = Status;
    this.dashboard  = dashboard;
    this.text       = "";
  }

  cssLocal() {
    return {
      status$c: {
        padding$px: 8,
        fontSize: '90%'
      }
    };
  }
  
  render() {
    return jst.$div(
      {cn: "-status"},
      this.text
    );
  }

  setUpdate(text) {
    this.text = text;
    this.refresh();
  }

}
