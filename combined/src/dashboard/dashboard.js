import {jst}             from 'jayesstee';
import {defs}            from '../defs.js';
import Messaging         from '../messaging.js';
import {Pane}            from './pane.js';
import {Conductors}      from './conductors.js';
import {Symphonies}      from './symphonies.js';
import {Musicians}       from './musicians.js';
import {Status}          from './status.js';
import {Songs}           from './songs.js';



export class Dashboard extends jst.Object {
  constructor(app, params) {
    super();
    this.app             = app;
    this.theatreId       = 1;
    this.startTimeOffset = 10000;

    // Display Panes 
    this.panes  = [
      new Pane(this, {side: "left",  height: 14, width: 50,  body: Symphonies}),
      new Pane(this, {side: "right", height: 80, width: 50,  body: Musicians}),
      new Pane(this, {side: "left",  height: 16, width: 50,  body: Conductors}),
      new Pane(this, {side: "left",  height: 50, width: 50,  body: Songs}),
      new Pane(this, {side: "clear", height: 15, width: 100, body: Status})
    ];

    // Initialize Messaging
    this.messaging = new Messaging(
      {
        callbacks: {
          connected:          (...args) => this.connected(...args),
          register:           (...args) => this.rxRegister(...args),
          start_song:         (...args) => this.rxStartSong(...args),
          stop_song:          (...args) => this.rxStopSong(...args),
          complete_song:      (...args) => this.rxCompleteSong(...args),
          score_update:       (...args) => this.rxScoreUpdate(...args),
          reregister:         ()        => {},
          register_response:  ()        => {}
        }
      }
    );
    
    // References to the pane bodies
    this.components = {};
    for (let pane of this.panes) {
      let body = pane.getBody();
      this.components[body.component] = body;

      if (body.setMessaging) {
        body.setMessaging(this.messaging);
      }
    }


    // Temp
    // this.panes[1].body.addItem(
    //   {name: "testy", client_id: 1, channel_id: "4", hits: 10, misses: 20, spontaneousNotes: 1, percent: 90, latency: 150}
    // );
    // this.panes[1].body.addItem(
    //   {name: "test2", client_id: 2, channel_id: "4", hits: 10, misses: 20, spontaneousNotes: 1, percent: 90, latency: 150}
    // );
    // this.panes[2].body.addItem(
    //   {name: "myConductor", numSongs: "4", latency: 110}
    // );
    // this.panes[3].body.addItem(
    //   {name: "mySong", length: "190", numChannels: 4, conductor_name: "bob"}
    // );
    // this.panes[0].body.addItem(
    //   {name: "mySong", latency: 90}
    // );
    
  }


  //
  // Rendering Stuff
  //

  // Scoped to only this object
  cssLocal() {
    return {
      header$c: {
        backgroundColor: defs.global.color.primary,
        fontSize$pt:     20,
        padding$px:      5,
        color:           "white",
      },
      body$c: {
        fontSize$pt:   20,
        padding$px:    0,
        margin$px:     0,
      },
    };
  }

  cssGlobal() {
    return {
      body: {
        overflow:      "hidden"
      }
    };
  }

  render() {
    return jst.$div(
      {cn: '-fullPage'},

      // Header
      jst.$div(
        {cn: '-header'},
        "Orchestra Hero Dashboard"
      ),

      // Body
      jst.$div(
        {cn: '-body'},
        this.panes
      )
    );
  }



  //
  // Messaging Callbacks
  //

  connected() {
    this.messaging.subscribe(
      "orchestra/broadcast",
      "orchestra/p2p/" + this.myId,
      "orchestra/registration",
      "orchestra/theatre/default", // add for now to get complete song message
      "orchestra/theatre/default/score_update"

    );
    this.messaging.sendMessage(`orchestra/broadcast`,
                               {msg_type: "reregister"});
  }

  rxRegister(topic, message) {

    for (let checkField of ["component_type", "name"]) {
      if (!message[checkField]) {
        console.warn("Received invalid register message. Missing ", checkField);
        this.messaging.sendResponse(message, {status: 'error', message: 'Missing ' + checkField});
        return;
      }
    }

    if (this.components[message.component_type]) {
      this.components[message.component_type].register(message);
    }
    else {
      console.warn("Unexpected component_type in register message:",
                   message.component_type, message);
      this.messaging.sendResponse(message,
                                  {status: 'error',
                                   message: 'Unexpected component_type: ' +
                                   message.component_type});
      return;
    }

    this.messaging.sendResponse(message, {status: 'ok'});

  }

  rxStartSong(topic, message) {
    console.log("Received start_song message: ", message);
    this.messaging.sendResponse(message, {status: 'ok'});
  }
  
  rxStopSong(topic, message) {
    console.log("Received stop_song message: ", message);
  }
  
  rxCompleteSong(topic, message) {
    this.components.song.rxCompleteSong(message);
    this.setAllComponentState("idle");
  }
  
  rxScoreUpdate(topic, message) {
    this.components.musician.rxScoreUpdate(message);
  }


  // General Methods
  
  getComponent(type) {
    return this.components[type];
  }

  statusUpdate(text) {
    this.components.status.setUpdate(text);
  }

  
}







