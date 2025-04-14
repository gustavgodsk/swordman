// src/lib/audio/AudioManager.js
export let audio = $state({
  soundManager: null,
  musicManager: null,
  init: function(){
    let soundMng = new SoundManager();
    this.soundManager = soundMng;
    this.musicManager = new MusicManager(soundMng.context, soundMng.masterGain);
  }
});

export class SoundManager {
  constructor(maxChannels = 16) {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
    
    this.sounds = new Map(); // Map to store loaded sound buffers
    this.pools = new Map();  // Map to store audio pools
    this.maxChannels = maxChannels;
    this.muted = false;

    this.initialized = false;
  }

  async init(){
    // Load all game sounds
    await Promise.all([
      this.loadSound('sword-slash', '/audio/sword-slash.mp3'),
      this.loadSound('sword', '/audio/sword.wav'),
      this.loadSound('fireball', '/audio/fireball.wav'),
      this.loadSound('electrocute', '/audio/electrocute.mp3'),
      this.loadSound('levelup', '/audio/levelup.mp3'),
      // this.loadSound('choose', '/audio/choose.mp3'),
      this.loadSound('takeit', '/audio/takeit.mp3'),
      this.loadSound('scale', '/audio/scale.mp3'),
      this.loadSound('victoryhorn', '/audio/victoryhorn.mp3'),
      this.loadSound('playerhit', '/audio/playerhit.mp3'),
      this.loadSound('flame', '/audio/flame.ogg'),
      this.loadSound('icicles', '/audio/icicles.wav'),
      this.loadSound('experience', '/audio/experience.mp3'),
    ]);

    // Set initial volume
    this.setVolume(0.7);
  }

  // Load a sound file and store its buffer
  async loadSound(id, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.sounds.set(id, audioBuffer);
      this.pools.set(id, []);
      
      // Pre-create a pool of audio sources
      for (let i = 0; i < 3; i++) {
        this._createSource(id);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to load sound ${id}:`, error);
      return false;
    }
  }

  // Create a new audio source for the pool
  _createSource(id) {
    if (!this.sounds.has(id)) return null;
    
    const source = this.context.createBufferSource();
    source.buffer = this.sounds.get(id);
    
    const gainNode = this.context.createGain();
    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    const pool = this.pools.get(id);
    pool.push({ source, gainNode, available: true });
    
    return { source, gainNode };
  }

  // Get an available source from the pool or create a new one
  _getSource(id) {
    if (!this.pools.has(id)) return null;
    
    const pool = this.pools.get(id);
    let poolItem = pool.find(item => item.available);
    
    if (!poolItem && pool.length < this.maxChannels) {
      poolItem = this._createPoolItem(id);
    }
    
    if (poolItem) {
      poolItem.available = false;
      
      // Create a NEW source node each time
      const source = this.context.createBufferSource();
      source.buffer = this.sounds.get(id);
      source.connect(poolItem.gainNode);
      
      return { source, gainNode: poolItem.gainNode, poolItem };
    }
    
    return null;
  }

  // Create a pool item (not a complete source)
  _createPoolItem(id) {
    if (!this.sounds.has(id)) return null;
    
    const gainNode = this.context.createGain();
    gainNode.connect(this.masterGain);
    
    const poolItem = { gainNode, available: true };
    const pool = this.pools.get(id);
    pool.push(poolItem);
    
    return poolItem;
  }

  // Play a sound with optional parameters
  play(id, { volume = 1.0, pan = 0, pitch = 1.0, loop = false } = {}) {
    if (this.muted) return null;
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    const sourceObj = this._getSource(id);
    if (!sourceObj) return null;
    
    const { source, gainNode, poolItem } = sourceObj;
    
    // Apply settings
    source.loop = loop;
    source.playbackRate.value = pitch;
    gainNode.gain.value = volume;
    
    // Optional stereo panning (same as before)
    if (pan !== 0) {
      const panNode = this.context.createStereoPanner();
      gainNode.disconnect();
      gainNode.connect(panNode);
      panNode.connect(this.masterGain);
      panNode.pan.value = pan;
    }
    
    // Put the poolItem back in the pool when it finishes
    source.onended = () => {
      poolItem.available = true;
      if (pan !== 0) {
        gainNode.disconnect();
        gainNode.connect(this.masterGain);
      }
    };
    
    source.start(0);
    return source;
  }

  // Stop a specific sound
  stop(source) {
    if (source) {
      try {
        source.stop(0);
      } catch (e) {
        // Source might have already stopped
      }
    }
  }

  // Stop all sounds
  stopAll() {
    this.pools.forEach(pool => {
      pool.forEach(src => {
        if (!src.available) {
          try {
            src.source.stop(0);
          } catch (e) {
            // Source might have already stopped
          }
          src.available = true;
        }
      });
    });
  }

  // Set master volume
  setVolume(value) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // Mute/unmute all sounds
  setMute(mute) {
    this.muted = mute;
    if (mute) {
      this.previousVolume = this.masterGain.gain.value;
      this.masterGain.gain.value = 0;
    } else {
      this.masterGain.gain.value = this.previousVolume || 1;
    }
  }
  
  // Release resources when no longer needed
  dispose() {
    this.stopAll();
    this.sounds.clear();
    this.pools.clear();
    this.context.close();
  }
}

// src/lib/audio/MusicManager.js
export class MusicManager {
  constructor(audioContext, masterGain) {
    this.context = audioContext;
    this.masterGain = masterGain;
    
    // Create a separate gain node for music
    this.musicGain = this.context.createGain();
    this.musicGain.connect(this.masterGain);
    
    this.tracks = [];
    this.currentTrackIndex = 0;
    this.currentSource = null;
    this.isPlaying = false;
    this.crossfadeDuration = 2; // seconds for crossfade
    this.volume = 0.1; // default music volume
  }

  async init(){
    await this.loadTracks([
      '/audio/music/title.wav',
      '/audio/music/crystalcave.mp3',
      '/audio/music/level1.wav',
      '/audio/music/level2.wav',
      '/audio/music/level3.wav',
      '/audio/music/ending.wav'
    ]);
  }
  
  // Load all music tracks
  async loadTracks(trackUrls) {
    try {
      const loadPromises = trackUrls.map(url => this.loadTrack(url));
      this.tracks = await Promise.all(loadPromises);
      return true;
    } catch (error) {
      console.error("Failed to load music tracks:", error);
      return false;
    }
  }
  
  // Load a single track
  async loadTrack(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    return {
      buffer: audioBuffer,
      url: url,
      name: url.split('/').pop().split('.')[0] // Extract filename without extension
    };
  }
  
  // Start playing the music playlist
  start() {
    if (this.tracks.length === 0) {
      console.warn("No music tracks loaded");
      return;
    }
    
    this.currentTrackIndex = 0; //start from beginning
    this.isPlaying = true;
    this.playCurrentTrack();
  }
  
  // Play the current track
  playCurrentTrack() {
    if (!this.isPlaying || this.tracks.length === 0) return;
    
    const track = this.tracks[this.currentTrackIndex];
    
    // Create a new source
    const source = this.context.createBufferSource();
    source.buffer = track.buffer;
    
    // Create gain node for this source (for crossfading)
    const trackGain = this.context.createGain();
    trackGain.gain.value = this.volume;
    
    source.connect(trackGain);
    trackGain.connect(this.musicGain);
    
    // When track ends, play the next one
    source.onended = () => {
      this.nextTrack();
    };
    
    // Store the current source and gain node
    this.currentSource = {
      source,
      gainNode: trackGain
    };
    
    // Start playing
    source.start(0);
    
    // Optional: Log which track is playing
    console.log(`Now playing: ${track.name}`);
  }
  
  // Skip to the next track with crossfade
  nextTrack() {
    if (!this.isPlaying || this.tracks.length <= 1) return;
    
    // Keep reference to current track for crossfade
    const oldSource = this.currentSource;
    
    // Move to next track (loop back to beginning if needed)
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    
    // Start playing new track
    this.playCurrentTrack();
    
    // If we have a previous track, crossfade
    if (oldSource) {
      this.crossfade(oldSource, this.currentSource);
    }
  }
  
  // Previous track with crossfade
  previousTrack() {
    if (!this.isPlaying || this.tracks.length <= 1) return;
    
    // Keep reference to current track for crossfade
    const oldSource = this.currentSource;
    
    // Move to previous track
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
    
    // Start playing new track
    this.playCurrentTrack();
    
    // If we have a previous track, crossfade
    if (oldSource) {
      this.crossfade(oldSource, this.currentSource);
    }
  }
  
  // Handle crossfading between tracks
  crossfade(oldTrack, newTrack) {
    const { source: oldSource, gainNode: oldGain } = oldTrack;
    const { gainNode: newGain } = newTrack;
    
    const now = this.context.currentTime;
    
    // Fade out old track
    oldGain.gain.setValueAtTime(this.volume, now);
    oldGain.gain.linearRampToValueAtTime(0, now + this.crossfadeDuration);
    
    // Fade in new track
    newGain.gain.setValueAtTime(0, now);
    newGain.gain.linearRampToValueAtTime(this.volume, now + this.crossfadeDuration);
    
    // Stop the old source after fade out
    setTimeout(() => {
      try {
        oldSource.stop();
      } catch (e) {
        // Source might already be stopped
      }
    }, this.crossfadeDuration * 1000);
  }
  
  // Stop playing
  stop() {
    this.isPlaying = false;
    
    if (this.currentSource) {
      try {
        this.currentSource.source.stop();
      } catch (e) {
        // Source might already be stopped
      }
      this.currentSource = null;
    }
  }
  
  // Pause playback
  pause() {
    if (this.currentSource && this.isPlaying) {
      this.isPlaying = false;
      try {
        this.currentSource.source.stop();
      } catch (e) {
        // Source might already be stopped
      }
      
      // Store the current position for resume
      this._pausedTime = this.context.currentTime;
    }
  }
  
  // Set music volume (0-1)
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    
    if (this.currentSource) {
      this.currentSource.gainNode.gain.value = this.volume;
    }
    
    // Update the music gain node as well
    this.musicGain.gain.value = this.volume;
  }
  
  // Mute/unmute music
  setMute(mute) {
    this.musicGain.gain.value = mute ? 0 : this.volume;
  }
}