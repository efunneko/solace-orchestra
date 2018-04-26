import './index.scss';
import instrumentDict from "./instruments";
import Messaging      from "../../common/messaging";


const sliderTimeSecs = 1.5;
const colours = ['#0074d9', '#d83439', '#38b439', '#e9cd54', '#811ed1', '#e66224', '#e041ab'];

let hitNotes = {};

let trackPositions = {};
const line_spacing = 20;
const allSliders = [];

function addTimedSlider(message) {
    let timeoutSeconds = message.play_time - message.current_time - (sliderTimeSecs * 1000);

    setTimeout(function () {
        addSlider(message.id, message.channel, message.track);
    }, timeoutSeconds * 1000);
}

function buildTracks(channel_list) {
    trackPositions = {};

    let lines = document.getElementById("lines");

    while (lines.firstChild) {
        lines.removeChild(lines.firstChild);
    }

    let trackPos = 274;
    let linePos = 280;

    for (let channel of channel_list) {
        trackPositions[channel.toString()] = [];

        for (let index of colours.keys()) {
            trackPos -= line_spacing;
            linePos -= line_spacing;

            trackPositions[channel.toString()].push(trackPos + "px");

            let line = document.createElement("div");
            line.id = "line-" + channel + "-" + index;
            line.className += "line";
            line.style.top = linePos + "px";

            lines.appendChild(line);
        }

        trackPos -= line_spacing;
        linePos -= line_spacing;
    }
}

function buildSlider(id, channel, track) {
    let slider = {};
    slider.element = document.createElement("div");
    slider.track = track;
    slider.id = id;
    slider.element.style.position = "absolute";
    slider.element.style.top = trackPositions[channel][Number(track) - 1];
    slider.element.className +=
        "slider slider-anim-" + track + " shape colour" + track;

    slider.addTime = Date.now();
    return slider;
}

function addSlider(id, channel, track) {
    let sliders = document.getElementById("sliders");
    let slider = buildSlider(id, channel, track);
    sliders.appendChild(slider.element);

    allSliders.push(slider);

    // Remove the slider after it hits the end
    setTimeout(function () {
        slider.element.remove();
        slider.removeTime = Date.now();
        slider = {};
    }, sliderTimeSecs * 1000);

    // Remove the event
    setTimeout(function () {
        let index = allSliders.map(function (s) {
            return s.id;
        }).indexOf(id);
        allSliders.splice(index, 1);
    }, sliderTimeSecs * 1000 + 200);
}

class Symphony {
    constructor() {
        this.noteHits = {};
        this.messaging = new Messaging(
            {
                callbacks: {
                    connected: (...args) => this.connected(...args),
                    start_song: (...args) => this.rxStartSong(...args),
                    stop_song: (...args) => this.rxStopSong(...args),
                    complete_song: (...args) => this.rxCompleteSong(...args),
                    score_update: (...args) => this.rxScoreUpdate(...args),
                    note: (...args) => this.rxNote(...args),
                    play_note: (...args) => this.rxPlayNote(...args),
                    note_list: (...args) => this.rxNoteList(...args),
                    reregister: (...args) => this.rxRegister(...args),
                    register_response: (...args) => this.rxRegisterResponse(...args),
                }
            }
        );

        // Extracted from all current songs
        // TODO: need to learn this from all conductors at start time rather than
        // hardcoded
        const instruments = [0, 4, 16, 22, 24, 25, 26, 27, 28, 29, 30, 33,
                             35, 47, 48, 52, 56, 60, 68, 70, 71, 73, 74, 95, 120];
        console.log("Loading " + instruments.length + " instruments...");
        let lastProgress = 0;
        MIDI.loadPlugin({
	    soundfontUrl: "midi/soundfont/MusyngKite/",
	    instruments: instruments,
	    onprogress: function(state, progress) {
                let percent = (progress*100.0).toFixed(0);
                if (percent - lastProgress > 9) {
                    console.log("Instrument loading progress: " + percent + "%");
                    lastProgress = percent;
                }
	    },
	    onsuccess: function() {
                console.log("Instruments Loaded!");
	    }
        });
                    

    }

    connected() {
        console.log("Connected to Solace Messaging");

        this.messaging.subscribe(
            "orchestra/theatre/default/+"
        );

        this.rxRegister();
    }

    rxRegister(topic, message) {
        this.messaging.sendMessage("orchestra/registration", {
            'msg_type':       'register',
            'component_type': 'symphony',
            'name':           'symphony_0'
        });
    }

    rxRegisterResponse(topic, message) {

    }

    rxStartSong(topic, message) {
        let channelList = [];
        for (let key of Object.keys(message.song_channels)) {
            channelList.push(message.song_channels[key]["channel_id"]);
        }

        buildTracks(channelList);

        this.messaging.sendResponse(message, {});
    }

    rxStopSong(topic, message) {
        buildTracks([0]);
        hitNotes = {};
    }

    rxNote(topic, message) {
        for (let note of message.note_list) {
            note.current_time = new Date().getMilliseconds();
            note.play_time = note.current_time;
            addTimedSlider(note);
            if (note.program) {
                MIDI.programChange(note.channel, note.program);
            }
            MIDI.setVolume(note.channel, 127);
	    MIDI.noteOn(note.channel, note.note, 127, 0);
	    MIDI.noteOff(note.channel, note.note, 0 + 0.5);
        }
    }

    rxPlayNote(topic, message) {
        hitNotes[message.note] = 0;
    }

    rxNoteList(topic, message) {
        for (let note of message.note_list) {
            (function(note) {
                let safeNote = Object.assign({}, note);
                let delay = (safeNote.play_time - safeNote.current_time) + (sliderTimeSecs * 1000);

                addTimedSlider(safeNote);

                setTimeout(function () {
                    if (safeNote.program) {
                        MIDI.programChange(safeNote.channel, safeNote.program);
                    }
                    MIDI.setVolume(safeNote.channel, 127);
	            MIDI.noteOn(safeNote.channel, safeNote.note, hitNotes.hasOwnProperty(note.note_id) ? 63 : 127, 0);
	            MIDI.noteOff(safeNote.channel, safeNote.note, 0 + 0.5);

                }, delay);
            })(note);
        }
    }
}

let symphony = new Symphony();
buildTracks([0]);
