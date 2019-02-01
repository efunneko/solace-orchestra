import {jst}             from 'jayesstee';
import {defs}            from '../defs.js';
import {RemoteComponentList,
        LocalComponent}  from './common.js';
import {templates,
        formatters}      from '../templates.js';

export class Songs extends RemoteComponentList {
  constructor(dashboard) {
    super(dashboard);
    this.component   = "song";
    this.type        = Song;
    this.currentSong = undefined;
    this.stateColumn = "all";

    this.fields = [
      {title: "",           name: "action"},
      {title: "Name",       name: "song_name"},
      {title: "Length",     name: "song_length", format: formatters.secsToTime},
      {title: "# Channels", name: "numChannels"},
      {title: "Conductor",  name: "conductor_name"},
    ];
    
  }

  cssLocal() {
    return [
      super.cssLocal(),
      {
        actionCell$c: {
          minWidth$em: 1
        },
        
        actionButton$c: {
          cursor:     "pointer",
        },

        actionButton$c$hover: {
          color:      "blue",
        },

        actionInactive$c: {
          cursor:     "default",
          opacity:    0.5,
        },

        actionInactive$c$hover: {
          color:      "black",
        },
      }
    ];
  }
  
  removeSongsForConductor(id) {
    this.items = this.items.filter(val => val.conductor_id !== id);
  }

  rxCompleteSong(topic, message) {
    if (this.currentSong) {
      this.currentSong.stop();
    }
  }

  setCurrentSong(song) {
    if (this.currentSong) {
      this.currentSong.stop();
    }
    this.setAllState("Inactive");
    song.setState("Active");
    this.currentSong = song;
    this.refresh();
  }

  stopCurrentSong() {
    if (this.currentSong) {
      this.currentSong.stop();
    }
    this.setAllState("Idle");
    delete this.currentSong;
    this.refresh();
  }

  sortFunc(a, b) {
    return a.fields.numChannels - b.fields.numChannels;
  }
  
}


class Song extends LocalComponent {
  constructor(messaging, parent, me) {
    super(messaging, parent, me);
    this.amPlaying     = false;
    this.fields.action = () => this.renderActionCell();
    this.state         = "Idle";
  }

  renderActionCell() {
    return jst.$i(
      {events: {click: e => this.actionClicked()},
       cn: "-actionButton fa " +
       (typeof this.parent.currentSong !== "undefined" ?
        this.amPlaying ?
        "fa-stop-circle" :
        "fa-play-circle song-action-inactive" :
        "fa-play-circle")
      }
    );
  }

  actionClicked() {
    if (this.amPlaying) {
      this.stop(true);
    }
    else if (this.parent.currentSong) {
      // Do nothing - must stop current song first
    }
    else {
      this.start();
    }
  }

  stop(sendMessage) {
    if (this.amPlaying) {
      this.amPlaying = false;
      this.parent.dashboard.statusUpdate(`Stopped playing ${this.fields.song_name}`);
      if (sendMessage) {
        let msg = {
          msg_type:       "stop_song",
          song_id:        this.fields.song_id,
          song_name:      this.fields.song_name
        };
        let topic = `orchestra/theatre/default`;
        this.messaging.sendMessage(topic, msg);
      }
      this.parent.stopCurrentSong();
      this.refresh();
    }
  }

  start() {
    
    this.parent.setCurrentSong(this);
    this.amPlaying     = true;
    this.parent.dashboard.statusUpdate(`${this.fields.song_name} is now playing`);
    this.sendStartSongMessage();
    this.refresh();
  }

  sendStartSongMessage() {
    this.parent.dashboard.sendStartSongMessage(this);
    this.refresh();
  }
  

  handleStartSongResponse(conductor, txMessage, rxMessage) {
    console.log("Start song response");
  }
  
}
