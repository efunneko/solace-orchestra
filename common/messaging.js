import env  from "./env";
import mqtt from "../node_modules/mqtt";


export default class Messaging { 
  
  constructor(opts) {
    this.isConnected    = false;
    // this.WILDCARD       = "*"; // Wildcard for topic subscriptions in SMF
    this.WILDCARD       = "+"; // Wildcard for topic subscriptions in MQTT
    this.msgId          = 1;
    this.myId           = Math.random().toString().substr(2);

    this.callbacks      = opts.callbacks;
    this.pendingReplies = {};

    this.client = mqtt.connect(
      env.broker.url, {
        username: env.broker.username,
        password: env.broker.password
      });

    let self = this;
    this.client.on("connect", function() {
      self._connected.apply(self);
    });

    this.client.on('message', function (topic, message) {
      self._processRxMessage.apply(self, [topic, message]);
    });
  }

  // Inject a list of subscriptions for this client
  subscribe(...subs) {
    for (let sub of subs) {
      this.client.subscribe(sub);
    }
  }

  // Remove a list of subscriptions for this client
  unsubscribe(...subs) {
    for (let sub of subs) {
      this.client.unsubscribe(sub);
    }
  }

  // Send a response to a previously received message
  sendResponse(rxMessage, txMessage) {
    let topic          = this._makeReplyTopic(rxMessage.client_id);
    txMessage.msg_type = rxMessage.msg_type + "_response";
    txMessage.msg_id   = rxMessage.msg_id;
    this.sendMessage(topic, txMessage);
  }

  // Send a message to the specified topic
  //
  // This function will:
  //   * fill in the client_id
  //   * fill in the current_time
  //   * fill in the msg_id
  //
  // If a callback is specified, the message will be considered to be
  // a request reply. In this case it will:
  //   * Set the specified timeout for the message (default 5s)
  //   * Store the sent message and callback against the msg_id of the sent message
  //   * On reception of the response, it will call the callback with the
  //     sent message and received response.
  //   * On timeout, it will call the timeout with the received response set
  //     to {status: 'timeout'}
  //
  sendMessage(topic, message, callback, timeout, retries) {
    let txMsg = Object.assign({}, message);
    txMsg.client_id    = this.myId;
    txMsg.current_time = this.getTime();

    if (!txMsg.msg_id) {
      txMsg.msg_id = this.msgId++;
    }
    
    if (!this.isConnected) {
      console.error("Not yet connected");
    }

    if (txMsg.msg_type !== "ping") {
      console.log("Sending:", txMsg);
    }
    
    if (callback) {
      // Request-reply message
      if (!timeout) {
        timeout = 5000;
      }
      this.pendingReplies[txMsg.msg_id] = {
        txMessage: txMsg,
        callback:  callback,
        retries:   retries,
        timer:     setTimeout(() => {
          if (this.pendingReplies[txMsg.msg_id].retries) {
            this.client.publish(topic,
                                JSON.stringify(txMsg));
            this.pendingReplies[txMsg.msg_id].retries--;
          }
          else {
            clearTimeout(this.pendingReplies[txMsg.msg_id].timer);
            delete this.pendingReplies[txMsg.msg_id];
            callback(message, {status: "timeout"});
          }
        }, timeout)
      };
    }

    // console.log("Publishing:", topic, message);
    this.client.publish(topic,
                        JSON.stringify(txMsg));

  }

  // Are we connected right now
  getIsConnected() {
    return this.isConnected;
  }

  getTime() {
    // TODO: Fill in syched time offset here
    return (new Date()).getTime();
  }
  
  /**
   * Returns the offset in milliseconds to be added to local time
   * to get the synchronized reference time
   */
  getTimeOffset() {
    return this.timeoffset;
  }
  
  /**
   * Returns the synchronized reference time
   */
  getSyncedTime() {
    return (new Date()).getTime() + this.timeoffset;
  }

  // Private methods

  _connected() {
    this.isConnected = true;
    this.subscribe(`orchestra/p2p/${this.myId}`);
    this.subscribe(`orchestra/broadcast`);
    if (this.callbacks.connected) {
      this.callbacks.connected();
    }
  }

  _processRxMessage(topic, messageText) {
    let message;
    try {
      message = JSON.parse(messageText);
    }
    catch(e) {
      console.warn("Failed to parse message:", message, e);
      return;
    }

    let msgType = message.msg_type;

    if (!msgType) {
      console.warn("Received message is missing msg_type");
      return;
    }

    let rxClientId = message.client_id;
    if (!rxClientId) {
      console.warn("Received message is missing client_id");
    }
    
    let currTime = message.current_time;
    if (!currTime) {
      console.warn("Received message is missing current_time");
    }
    
    let msgId = message.msg_id;
    if (!msgId) {
      console.warn("Received message is missing msg_id");
    }
    // console.log("Got message: ", message);
    
    // Auto resend pings
    if (msgType === "ping") {
      this.sendResponse(message, {});
    }
    else if (msgType === "start_song") {
      // start time sync first, passing the start-song trigger topic and message
      this.syncRetries = 5;   // sync time sample size
      this.lowestLat = 500; // lowest latency starting point
      this.timeoffset = undefined;
      this._sendTimeRequest(topic, message);
    }
    else if (msgType.match(/_response/) &&
             this.pendingReplies[msgId]) {
      let info = this.pendingReplies[msgId];
      clearTimeout(info.timer);
      info.callback(info.txMessage, message);
    }
    else {
      if (this.callbacks[msgType]) {
        this.callbacks[msgType](topic, message);
      }
      else {
        console.log("Unhandled message. Message type: ", msgType, "Full message:", message);
      }
    }
   
  }

  _makeReplyTopic(clientId) {
    return `orchestra/p2p/${clientId}`;
  }

  _sendTimeRequest(startSongTopic, startSongMessage) {
    this.sendMessage(startSongMessage.time_server_topic,
      { msg_type: 'ping' },
      (txMessage, rxMessage) => {
          this._handleTimeResponse(txMessage, rxMessage, startSongTopic, startSongMessage);
      });
  }

  _handleTimeResponse(txMessage, rxMessage, startSongTopic, startSongMessage) {
      let latency = ((new Date()).getTime() - txMessage.current_time) / 2;
      console.log('Got ping response! Latency:' + latency + ', Reference time:' + rxMessage.current_time);
      if (latency < this.lowestLat) {
          console.log('Updating time offset');
          this.timeoffset = rxMessage.current_time - ((new Date()).getTime() + txMessage.current_time) / 2;
          this.lowestLat = latency;
      }
      // iterate or call callback when ready
      if (--this.syncRetries > 0) {
          this._sendTimeRequest(startSongTopic, startSongMessage);
      } else {
          if (this.callbacks.start_song) {
            this.callbacks.start_song(startSongTopic, startSongMessage);
          }
        }
  }
}

