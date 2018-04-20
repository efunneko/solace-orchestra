# Conductor
import sys
import math
import mido
import time
import pprint
import copy
import re
import threading

from solace.client import SolaceMQTTClient

from os      import listdir, getcwd, getpid
from os.path import isfile, join

import json

def get_unique_notes_in_channel(notes_in_channel):
    """ Utility function to get an ordered set of unique notes in the channel """
    all_notes = []
    for notes in notes_in_channel:
        all_notes.append(notes.note)

    return sorted(set(all_notes))
    
class Conductor:

    def __init__(self):
        
        self.channel_instrument = {}

        # The conversion of MIDI notes is based on this: 
        # https://www.midikits.net/midi_analyser/midi_note_numbers_for_octaves.htm
        self.notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

        # Path to the midi files
        self.midi_file_path = getcwd() + "/midi_files"

        # The list of midi filenames
        self.midi_files = self.get_midi_files(self.midi_file_path)

        # Parse midi files
        self.parseMidiFiles()

        # Topic format = orchestra/theatre/default
        # orchestra - constant
        # theatre - the "room" that the song is played in. Default value is 'default'
        # channel - the "instument being played"
        self.theatre = 'default'

        # Redirect for callbacks
        def onConnect():
            self.onConnect()

        def onReregister(*args):
            self.onReregister(*args)
        
        def onStartSong(*args):
            self.onStartSong(*args)
        
        def onStopSong(*args):
            self.onStopSong(*args)
        
        # Create and initialize solace messaging client
        self.solace = SolaceMQTTClient(callbacks={'connect': onConnect,
                                                  'start_song': onStartSong,
                                                  'stop_song': onStopSong,
                                                  'reregister': onReregister})

        # Unique id assigned to each message (note)
        self.unique_id = 0

        # Total number of tracks playable on game controller
        self.number_of_tracks_on_game_controller = 7

        self.channels = {}

        # The filename of the selected song
        self.selected_song_file = {}

        # The midi events of the selected song
        self.selected_song_midi = {}

        # Game controller default time offset between when the note is
        # received and when it's played (amount of time it takes for the
        # note to travel down the UI track component)
        self.game_controller_play_offset_sec = 1.5;

        # The length of a quarter note in milli seconds
        # 60 seconds / tempo (beats per minute)
        self.quarterNoteLength = 60/80*1000;

    def parseMidiFiles(self):
        self.song_list = []
        self.midis     = []

        song_id = 0
        for file in self.midi_files:
            midi = mido.MidiFile(self.midi_file_path + "/" + file)
            name = re.sub('\.mid$', '', file)
            info = {
                'song_name':     name,
                'song_channels': []
            }

            if (midi.length):
                info['song_length'] = math.ceil(midi.length)

            for channel_id in range(len(midi.tracks)):
                channel = midi.tracks[channel_id]
                notes = [n for n in channel if n.type == "note_on"]

                if notes:
                    channelInfo = {}
                    channelNum  = notes[0].channel
                    
                    channelInfo['channel_id']      = channelNum
                    channelInfo['num_notes']       = len(notes)
                    channelInfo['instrument_name'] = channel.name.strip(),

                    program_change = next((m for m in channel if m.type == 'program_change'), None)

                    if program_change:
                        print("Got program change")
                        print(program_change)
                        self.channel_instrument['channelNum'] = program_change.program
                    else:
                        self.channel_instrument['channelNum'] = 0

                    info['song_channels'].append(channelInfo)

            info['song_id'] = song_id
            
            self.song_list.append(info)
            self.midis.append(midi)

            song_id += 1
                    
            print(info);
                            
    def makeRegistrationMessage(self):
        return {
                'msg_type':       'register',
                'component_type': 'conductor',
                'name':           'conductor_' + str(getpid()),
                'song_list':      self.song_list
            }
        
    def onConnect(self):
        self.registrationMessage = self.makeRegistrationMessage()
        self.solace.sendMessage("orchestra/registration", self.registrationMessage)
        print("Connected!!")

    def onReregister(self, topic, rxMessage):
        # Reply with the original registration message
        self.solace.sendMessage("orchestra/registration", self.registrationMessage)
        
    def onStartSong(self, topic, rxMessage):
        songId          = rxMessage['song_id']
        theatreId       = rxMessage['theatre_id']

        self.solace.subscribe("orchestra/theatre/" + str(theatreId))
        self.songThread = threading.Thread(target=self.play_song, args=[songId])
        self.songThread.start()
        self.solace.sendResponse(rxMessage, {})

    def onStopSong(self, topic, rxMessage):
        self.stopSong = 1

    # Reads all of the files in the midi_files directory
    def get_midi_files(self, mypath):
         return [f for f in listdir(mypath) if isfile(join(mypath, f))]

    # Returns the list of songs
    def get_songs(self):
        return self.get_midi_files

    # Select one of the midi files in the midi_files directory and analyze
    # the song
    def select_song(self, song_index):
        self.selected_song_file = self.midi_files[song_index]
        self.selected_song_midi = mido.MidiFile(self.midi_file_path + "/" + self.selected_song_file)
        self.analyze_song()

    def analyze_song(self):
        """ Determine which tracks have enough notes to make it interesting """
        #pprint(vars(self.selected_song_midi))
        for channel_id in range(len(self.selected_song_midi.tracks)):
            channel = self.selected_song_midi.tracks[channel_id]
            notes_in_channel = [n for n in channel if n.type == "note_on"]

            if notes_in_channel:
                channel_number = notes_in_channel[0].channel

                self.channels[channel_number] = {
                    'instrument': channel.name.strip(),
                    'notes': len(notes_in_channel)
                }
                unique_notes = get_unique_notes_in_channel(notes_in_channel)
                self.channels[channel_number]['unique'] = unique_notes

                program_change = next((m for m in channel if m.type == 'program_change'), 0)
                self.channel_instrument[channel_number] = program_change.program

    def play_song(self, songId):
        self.stopSong = 0
        self.select_song(songId)
        for msg in self.selected_song_midi.play():
            if self.stopSong:
                return
            if msg.type == "note_on":
                channel_number = msg.channel
                topic = "orchestra/theatre/" + self.theatre + "/" + str(channel_number)
                unique_notes = self.channels[channel_number]['unique']
                #print(str(msg.channel) + ": " + self.notes[msg.note % 12])

                current_time = time.time()

                # Message body
                #  id: unique id for this note. Can be used for correlation by symphony
                #  program: The general midi identifier of the instrument being played
                #  track: The track on the game controller that the note will be placed on (1..7)
                #  note: The midi note number
                #  channel: The midi channel that denotes the instrument
                #  current_time: Epoch time in seconds UTC
                #  play_time: The time the note should be played
                message_body = {
                    'note_list': [
                        {
                        'note_id': str(self.unique_id),
                        'program': str(self.channel_instrument[channel_number]),
                        'track': str((unique_notes.index(msg.note) % self.number_of_tracks_on_game_controller) + 1),
                        'note': str(msg.note),
                        'channel': str(channel_number),
                        'duration': str(self.quarterNoteLength),
                        'current_time': str(current_time),
                        'play_time': str(current_time + self.game_controller_play_offset_sec)
                        }
                    ]}

                self.unique_id += 1
                #print("Topic: " + topic)
                #print(message_body)
                self.solace.publish(topic, json.dumps(message_body))

conductor = Conductor()
time.sleep(1000000)
