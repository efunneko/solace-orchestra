import {jst}                 from 'jayesstee';
import {defs}                from '../defs.js';
import {RemoteComponentList,
        RemoteComponent}     from './common.js';
import {templates,
        formatters}          from '../templates.js';

export class Conductors extends RemoteComponentList {
  constructor(dashboard) {
    super(dashboard);
    this.component    = "conductor";
    this.type         = Conductor;

    this.fields = [
      {title: "Name",    name: "name"},
      {title: "# Songs", name: "numSongs"},
      {title: "Ping",    name: "latency", format: formatters.formatLatency},
    ];
  }

  register(message) {

    this.songs = this.songs || this.dashboard.getComponent("song");

    if (!message.song_list) {
      console.warn("Received invalid register message. Missing song_list");
      this.messaging.sendResponse(
        message,
        {status: 'error', message: 'Missing song_list'}
      );
      return;
    }

    if (this.itemMap[message.client_id]) {

      // Already have a conductor with this name
      let conductor = this.itemMap[message.client_id];
      
      if (conductor.client_id !== message.client_id) {
        console.warn("Duplicate conductor of name ", message.name);
      }
      
      // Remove all old songs for this conductor
      this.songs.removeSongsForConductor(conductor.client_id);
      
    }

    console.log(message);
    for (let song of message.song_list) {
      let newSong = Object.assign(
        {
          conductor_name: message.name,
          conductor_id:   message.client_id,
          numChannels:    song.song_channels.length,
          channelList:    song.song_channels
        },
        song);

      console.log("new song", newSong);
      this.songs.addItem(newSong);
        
    }

    let conductor = {
      name:      message.name,
      client_id: message.client_id,
      numSongs:  message.song_list.length
    };
    
    this.addItem(conductor);

  }
  
}


class Conductor extends RemoteComponent {
  constructor(messaging, parent, me) {
    super(messaging, parent, me);
  }
}
