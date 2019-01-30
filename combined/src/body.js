import {jst}             from 'jayesstee';
import {JstForm}         from 'jayesstee.form';
import {defs}            from './defs.js';
import {Dashboard}       from './dashboard/dashboard.js';
import {Symphony}        from './symphony/symphony.js';

export class Body extends jst.Object {
  constructor(app) {
    super();
    this.app    = app;

    this.pages = {
      'welcome':     Welcome,
      'dashboard':   Dashboard,
      'symphony':    Symphony
    };

    this.app.router.on("/dashboard", () => this.app.event("change-page", {name: "dashboard"}));
    this.app.router.on("/symphony",  () => this.app.event("change-page", {name: "symphony"}));
    this.app.router.on("/*",         () => this.app.event("change-page", {name: "welcome"}));
    this.app.router.on("/",          () => this.app.event("change-page", {name: "welcome"}));

    this.app.on("change-page", data => this.setPage(data));

    this.setPage({name: "welcome"});
    
  }

  cssLocal() {
    return {
      body$i: {
        fontFamily: defs.global.font.family,
        padding$px: 0,
        margin$px: 0,
      }
    };
  }
  
  render() {
    return jst.$div(
      {id: "-body"},
      this.activePage
    );
  }

  handleChange(e) {
    let vals = this.form.getValues();
  }

  setPage(pageData) {
    let name = pageData.name;

    let params = {};

    if (pageData.params) {
      let paramList = pageData.params.split("&");
      for (let param of paramList) {
        let parts = param.split("=");
        params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
      }
    }

    if (this.pages[name]) {
      this.activePage = new this.pages[name](this.app, params);
    }
    else {
      this.activePage = undefined;
    }
    
    this.refresh();
    
  }

}


class Welcome extends jst.Object {
  constructor(app, params) {
    super();
    this.app = app;
  }

  cssLocal() {

    return {
      welcomeScreen$c: {
        textAlign: "center"
      },
      title$c: {
        margin$px: 40,
        fontSize$cm: 2,
        fontWeight: "bold"
      },
      bigButton$c: {
        cursor: "pointer",
        margin$px: [20, 40],
        padding$px: 40,
        display: "inline-block",
        fontSize$cm: 1.5,
        border$px: [1, "solid", jst.rgba(0,0,0,0.3)],
        boxShadow$px: [0,4,10,0,jst.rgba(0,0,0,0.3)]
      },
      bigButton$c$hover: {
        backgroundColor: "#ffe",
        boxShadow$px: [0,4,10,3,jst.rgba(0,0,0,0.3)]
      }
    };

  }

  
  render() {
    return jst.$div(
      {cn: "-welcomeScreen"},
      jst.$div(
        {cn: "-title"},
        "Solace Symphony"
      ),
      jst.$div(
        {cn: "-bigButton", events: {click: e => this.select('dashboard')}},
        "Dashboard"
      ),
      jst.$div(
        {cn: "-bigButton", events: {click: e => this.select('symphony')}},
        "Symphony"
      )
      
    );
  }

  select(page) {
    this.app.navigate({url: "/" + page});
  }

}
