import {jst}             from 'jayesstee';

export let formatters = {

  secsToTime: (secs) => {
    let date = new Date(null);
    date.setSeconds(parseInt(secs || 0));
    return date.toISOString().substr(11, 8);
  },

  formatLatency: (value) => {
    value = value || 0;
    let cn =
        value < 60  ? "rttFast" :
        value < 110 ? "rttMedium" :
        "rttSlow";
    return [{cn: cn},
            `${value} ms`];
  }

};

export let templates = {
  table: (opts) => jst.$table(
    {cn: 'pane-table'},
    jst.$thead(
      jst.$tr(
        opts.fields.map(field => jst.$th({cn: `th-${field.name}`}, field.title))
      )
    ),
    jst.$tbody(
      opts.model.map(
        row => jst.$tr(
          jst.if(row.state) && {cn: `row-state-${row.state}`},
          opts.fields.map(
            field => jst.$td(
              {cn: `td-${field.name}`},
              field.format ?
                field.format(row[field.name], row) :
                row[field.name]
            )
          )
        )
      )
    )
  ),


};
