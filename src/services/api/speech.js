const speechService = {
  currentUtterance: null,
  isSpeaking: false,

  async loadVoices() {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
      }
    });
  },

  async speak(text) {
    return new Promise((resolve, reject) => {
      // Check if browser supports speech synthesis
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported in this browser'));
        return;
      }

      // Cancel any ongoing speech
      if (this.isSpeaking) {
        window.speechSynthesis.cancel();
      }

      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;
      
      // Configure voice settings
      utterance.rate = 1.0;    // Speed (0.1 to 10)
      utterance.pitch = 1.0;   // Pitch (0 to 2)
      utterance.volume = 1.0;  // Volume (0 to 1)

      // Load voices and select a good one
      this.loadVoices().then(voices => {
        if (voices.length > 0) {
          // Prefer female voices for better clarity
          const femaleVoice = voices.find(voice => 
            voice.name.includes('Female') || 
            voice.name.includes('female') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Google US English Female')
          );
          utterance.voice = femaleVoice || voices[0];
        }

        // Set up event handlers
        utterance.onstart = () => {
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (event) => {
          this.isSpeaking = false;
          this.currentUtterance = null;
          // Don't reject if the error is due to interruption
          if (event.error === 'interrupted') {
            resolve();
          } else {
            console.error('Speech synthesis error:', event);
            reject(new Error(`Speech synthesis failed: ${event.error}`));
          }
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      }).catch(error => {
        reject(new Error(`Failed to load voices: ${error.message}`));
      });
    });
  },

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  },

  pause() {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  },

  resume() {
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }
};

export default speechService; 