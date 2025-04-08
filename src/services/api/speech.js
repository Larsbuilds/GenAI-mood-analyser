const speechService = {
  speak(text) {
    return new Promise((resolve, reject) => {
      // Check if browser supports speech synthesis
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 1.0;    // Speed (0.1 to 10)
      utterance.pitch = 1.0;   // Pitch (0 to 2)
      utterance.volume = 1.0;  // Volume (0 to 1)

      // Get available voices and select a good one
      const voices = window.speechSynthesis.getVoices();
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
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error('Speech synthesis failed'));

      // Start speaking
      window.speechSynthesis.speak(utterance);
    });
  },

  stop() {
    window.speechSynthesis.cancel();
  },

  pause() {
    window.speechSynthesis.pause();
  },

  resume() {
    window.speechSynthesis.resume();
  }
};

export default speechService; 