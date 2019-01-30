import {jst}             from 'jayesstee';

export class DuckLetterEffect extends jst.Object {
  constructor(text) {
    super();
    this.text      = text;
    this.letters   = this.getLetters(text);
  }

  cssLocal() {
    return {
      letters$c: {
        display: "inline-block"
      }
    };
  }
  
  cssInstance() {
    let css          = [];
    let numLets      = this.letters.length;
    let totalTime    = 100 * numLets;
    let stepSize     = 100/numLets/2;
    let step         = 0;
    let timePerStep  = totalTime/stepSize;
    let stepsPerDuck = 1000/timePerStep;
    for (let i = 0; i < numLets; i++) {
      let name = `${this._fullPrefix}duck${i}`;
      let frames = {
        $rule: name,
        '0%': {
          transform: jst.scaleX(1)
        }
      };

      frames[`${step}%`] = {
        transform: jst.scaleX(1)
      };
      frames[`${step + stepSize*timePerStep}%`] = {
        transform: jst.scaleX(0.5)
      };
      frames[`${step + 2*stepSize*timePerStep}%`] = {
        transform: jst.scaleX(1)
      };
      
      let animation = {
        $keyframes: frames
      };
      
      css.push(animation);

      let letterCss = {};
      letterCss[`letters${i}$c`] = {
        animationDuration$ms: totalTime,
        animationName:        name,
        animationIterationCount: "infinite"
      };
      css.push(letterCss);
      return css;
    }
    
    return {
      letters$c: {
        display: "inline-block"
      }
    };
  }

  
  render() {
    return this.letters;
  }


  getLetters(text) {
    let letters = text.split("");

    let els = letters.map((letter, i) => jst.$div({cn: `-letters --letters --letters${i}`}));

    console.log(els);
    return els;
  }

}
