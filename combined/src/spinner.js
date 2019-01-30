import {jst}       from 'jayesstee';
import {defs}      from './defs.js';


export class Spinner extends jst.Object {
  constructor(app, text, size) {
    super();
    this.text    = text || "";
    this.size    = size || 40;
    this.enabled = false;
  }

  cssInstance() {
    return {
      overlay$c: {
        position: 'fixed',
        top$px: 0,
        width: '100%',
        height: '100vh',
        backgroundColor: jst.rgba(0,0,0,0.3),
        textAlign: 'center'
      },
      banner$c: {
        display: 'inline-block',
        color: defs.global.color.primary,
        margin: 'auto',
        marginTop$vh: 35,
        backgroundColor: 'white',
        padding$px: 14,
        borderRadius$px: this.size/2,
        boxShadow$px: [0,0,25,3, jst.rgba(0,0,0,0.4), ",", 0,0,10,0, jst.rgba(0,0,200,0.35), "inset"]
      },
      spinner$c: {
        fontSize$px: this.size,
      }
    };
  }
  
  render() {
    if (this.enabled) {
      return jst.$div(
        {cn: "--overlay"},
        jst.$div(
          {cn: "--banner"},
          `${this.text} `,
          jst.$i(
            {cn: "--spinner fa fa-spinner fa-spin"}
          )
        )
      );
    }
    return "";
  }

  setText(text) {
    this.text = text;
    this.refresh();
  }

  start(text) {
    this.text    = text;
    this.enabled = true;
    this.refresh();
  }

  stop() {
    this.enabled = false;
    this.refresh();
  }

}
