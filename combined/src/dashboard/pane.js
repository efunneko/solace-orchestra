import {jst}             from 'jayesstee';
import {defs}            from '../defs.js';

export class Pane extends jst.Object {
  constructor(dashboard, opts) {
    super();
    this.dashboard  = dashboard;
    this.side       = opts.side;
    this.width      = opts.width;
    this.height     = opts.height;
    this.body       = new (opts.body)(dashboard, opts);
    this.title      = this.body.constructor.name;
    this.name       = this.title.toLowerCase();
  }

  getBody() {
    return this.body;
  }

  // Scoped to whole application
  cssGlobal() {
    return {
      th: {
        textAlign: "left",
      },
      'td,th': {
        paddingLeft$px: 15,
        //minWidth$em:    4
      },
      rttFast$c: {
        color: "darkgreen",
      },

      rttMedium$c: {
        color: "darkorange",
      },

      rttSlow$c: {
        color: "darkred",
      },

      rowStateIdle$c: {
        backgroundColor: "white",
      },

      rowStateWaiting$c: {
        backgroundColor: "#ffa",
      },

      rowStateReady$c: {
        backgroundColor: "#afa",
      },

      rowStateDisabled$c: {
        backgroundColor: "#bbb",
      }
      
    };
  }
  
  cssLocal() {
    return {
      pane$c: {
        position:     "relative",
        border$px:    [0, "solid", defs.global.color.primary],
        padding$px:   0,
        margin$px:    0,
        fontSize$pt:  16,
        boxShadow$px: [0, 0, 2, jst.rgba(0,0,0,1), "inset"],
      },

      'pane$c td, pane$c th': {
        paddingLeft$px:  10,
        paddingRight$px: 10,
      },

      paneHeader$c: {
        backgroundColor: defs.global.color.primary,
        color:           "white",
        padding$px:      5,
        zIndex:          1,
      },

      paneBody$c: {
        //position:   "absolute",
        top$pt:     25,
        bottom$px:  0,
        left$px:    0,
        right$px:   0,
        padding$px: 5,
        overflow:   "auto",
      },
      
    };
  }

  cssInstance() {
    return {
      pane$c: Object.assign({
        width$vw:   this.width,
        height$vh:  this.height
      }, this.side === "clear" ? {clear: "both"} : {float: this.side}),
    };
    
  }
  
  render() {
    return jst.$div(
      {cn: `-pane --pane`},
      jst.$div({cn: `-paneHeader`},
               this.title
              ),
      this.body
    );
  }

}
