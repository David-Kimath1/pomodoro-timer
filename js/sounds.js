// Sounds Module - Uses real audio files

const SoundManager = {
    activeSound: null,
    volume: 50,
    audioContext: null,
    currentAmbient: null,
    gainNode: null,
    ambientGain: null,

    // Alert sounds
    alertSounds: {
        bell: 'https://assets.mixkit.co/active_storage/sfx/2869/2869.wav',
        chime: 'https://assets.mixkit.co/active_storage/sfx/2860/2860.wav',
        digital: 'https://assets.mixkit.co/active_storage/sfx/2870/2870.wav'
    },

    // Ambient sounds - using free sound effects from Mixkit and Pixabay
    ambientSounds: {
        rain: 'https://pixabay.com/sound-effects/soft-rain-atmosphere-454683/',
        forest: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_317062f3b5.mp3',
        // cafe: 'https://pixabay.com/sound-effects/film-special-effects-cafe-da-manha-70755/',
        lofi: 'https://cdn.pixabay.com/download/audio/2022/05/17/audio_18008bf8c9.mp3'
    },

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume / 100;
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    },

    setVolume(value) {
        this.volume = value;
        if (this.gainNode) {
            this.gainNode.gain.value = value / 100;
        }
        if (this.ambientGain) {
            this.ambientGain.gain.value = (value / 100) * 0.5;
        }
    },

    // Play alert sound
    playAlert(soundName) {
        if (!this.audioContext) return;
        
        const url = this.alertSounds[soundName] || this.alertSounds.bell;
        this.playAudioFromUrl(url, this.gainNode);
    },

    // Play audio from URL through a gain node
    playAudioFromUrl(url, outputNode) {
        if (!this.audioContext) return;
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load audio');
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.loop = false;
                source.connect(outputNode);
                source.start(0);
                return source;
            })
            .catch(e => console.log('Error playing audio:', e));
    },

    // Create looping ambient from URL
    createLoopedAmbient(url, outputNode) {
        if (!this.audioContext) return;
        
        return fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load ambient');
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.loop = true;
                source.connect(outputNode);
                source.start(0);
                return source;
            });
    },

    // Start ambient sound
    startAmbient(type) {
        this.stopAmbient();
        
        if (!this.ambientGain) {
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.connect(this.gainNode);
            this.ambientGain.gain.value = (this.volume / 100) * 0.5;
        }
        
        const url = this.ambientSounds[type];
        if (!url) {
            console.log('No ambient sound for:', type);
            return;
        }
        
        this.activeSound = type;
        
        this.createLoopedAmbient(url, this.ambientGain)
            .then(source => {
                this.currentAmbient = source;
            })
            .catch(e => {
                console.log('Failed to start ambient sound:', e);
                // Fallback: generate a simple noise
                this.fallbackAmbient(type);
            });
    },

    // Fallback ambient using generated noise
    fallbackAmbient(type) {
        if (!this.audioContext) return;
        
        const bufferSize = 4 * this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        if (type === 'rain') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.3;
                if (i > 0) data[i] = data[i] * 0.5 + data[i-1] * 0.5;
            }
        } else if (type === 'forest') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.15;
                if (i > 2) data[i] = data[i] * 0.3 + data[i-1] * 0.4 + data[i-2] * 0.3;
            }
        } else if (type === 'cafe') {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.12;
                if (i % 15000 < 50) data[i] = Math.sin(i * 0.05) * 0.25;
            }
        } else {
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.08;
            }
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        if (!this.ambientGain) {
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.connect(this.gainNode);
        }
        this.ambientGain.gain.value = (this.volume / 100) * 0.5;
        
        source.connect(this.ambientGain);
        source.start(0);
        this.currentAmbient = source;
    },

    // Stop ambient sound
    stopAmbient() {
        if (this.currentAmbient) {
            try { this.currentAmbient.stop(); } catch (e) {}
            this.currentAmbient = null;
        }
        this.activeSound = null;
    }
};