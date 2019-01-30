import {jst}             from 'jayesstee';
import {defs}            from '../defs.js';

const sliderTimeMs = 1500;

export class ChannelPane extends jst.Object {
  constructor(symphony, channel) {
    super();
    this.symphony  = symphony;
    this.fields    = Object.assign({}, channel);
    this.sliders   = [];
    this.timeouts  = [];
  }

  cssLocal() {
    return {
      channelPane$c: {
        position:   "relative",
        width$px:  300,
        height$px: 300,
        border$px: [1, "solid", "#555"],
        margin$px: 4,
        boxShadow$px: [0,0,5,jst.rgba(0,0,0,0.3)]
      },
      header$c: {
        backgroundColor: defs.global.color.primary,
        color:           'white',
        whiteSpace:      'nowrap',
        overflow:        'hidden',
        padding$px:      2,
        borderRadius$px: 2
      },
      title$c: {
        display:         'inline-block',
        padding$px:      2
      },
      instrument$c: {
        display:         'inline-block',
        fontSize:        '75%',
        backgroundColor: defs.global.color.primaryHilight,
        margin$px:       [0,10],
        padding$px:      [1,5],
        borderRadius$px: 3
      },
      lineContainer$c: {
        margin$px:       [10,20,10,15]
      },
      line$c: {
        borderBottom$px: [2, "solid", "#888"],
        borderLeft$px:   [5, "double", "#888"],
        height$px:       27,
      },
      line0$c: {
        borderLeft$px: [0, "none"]
      },
      sliderBox$c: {
        position:        "absolute",
        top$px:          0,
        bottom$px:       0,
        left$px:         20,
        right$px:        20,
        overflow:        "hidden"
      }

    };
  }

  render() {
    return jst.$div(
      {cn: "-channelPane"},
      jst.$div(
        {cn: "-header"},
        jst.$div({cn: "-title"},      `Channel ${this.fields.channel_id}`),
        jst.$div({cn: "-instrument"}, this.fields.instrument_name || "Piano")
      ),
      this.renderLines(),
      jst.$div(
        {cn: "-sliderBox"},
        this.sliders
      )
    );
  }

  renderLines() {
    return jst.$div(
      {cn: "-lineContainer"},
      // inline 8 iteration loop
      [...Array(8).keys()].map(i => jst.$div({cn: `-line -line${i}`}))
    );
  }

  addSlider(delay, track) {
    let sliderDelay = delay - sliderTimeMs;

    this.timeouts.push(window.setTimeout(() => {
      this.addSliderAfterDelay(track);
    }, sliderDelay));
  }

  addSliderAfterDelay(track) {
    let id = this.sliderIds++;

    this.sliders.push(new Slider(track));

    // Remove the slider after it hits the end
    this.timeouts.push(window.setTimeout(e => {
      this.sliders.shift();
      this.refresh();
    }, sliderTimeMs));
    this.refresh();
  }

  addNote(note) {
    let delay       = note.play_time - this.symphony.messaging.getTime();
    let sliderDelay = delay - sliderTimeMs;
    let track       = note.track;
    this.addSlider(delay, track);
  }

  remove() {
    this.timeouts.map(to => window.clearTimeout(to));
  }
  
}


export class Slider extends jst.Object {
  constructor(track) {
    super();
    this.track = track;
  }

  cssLocal() {
    const stepSize = 29;
    let sliderTop  = 27;
    return {
      slider$c: {
        position:                "absolute",
        right$px:                -20,
        height$px:               26,
        width$px:                26,
        borderRadius$px:         13,
        backgroundColor:         "blue",
        animationDuration:       `${sliderTimeMs}ms`,
        animationName:           "slide",
        animationTimingFunction: "linear"
      },

      slider0$c: {
        top$px: sliderTop
      },
      slider1$c: {
        top$px: sliderTop+=stepSize
      },
      slider2$c: {
        top$px: sliderTop+=stepSize
      },
      slider3$c: {
        top$px: sliderTop+=stepSize
      },
      slider4$c: {
        top$px: sliderTop+=stepSize
      },
      slider5$c: {
        top$px: sliderTop+=stepSize
      },
      slider6$c: {
        top$px: sliderTop+=stepSize
      },
      slider7$c: {
        top$px: sliderTop+=stepSize
      },

      $keyframes: {
        $rule: "slide",
        from: {
          right$px: -20
        },
        to: {
          right$px: 260
        }
      }
    };
  }
  
  render() {
    return jst.$div({cn: `-slider -slider${this.track}`});
  }

}
