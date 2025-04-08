import axios from 'axios';

class RateLimiter {
  constructor(maxRequests = 15, timeWindow = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow; // 60 seconds in milliseconds
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove requests older than the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  addRequest() {
    this.requests.push(Date.now());
  }
}

const rateLimiter = new RateLimiter();

const stableLMClient = axios.create({
  baseURL: import.meta.env.VITE_STABLE_LM_API,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_STABLE_LM_API_KEY}`
  }
});

const validateInput = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  if (text.length > 1000) {
    throw new Error('Input exceeds 1000 character limit');
  }
  return text.trim();
};

export const stableLMService = {
  async getChatCompletion(prompt) {
    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const validatedPrompt = validateInput(prompt);

    try {
      rateLimiter.addRequest();
      const response = await stableLMClient.post('/v1/chat/completions', {
        model: 'stabilityai/stable-zephyr-3b',
        messages: [{ role: 'user', content: validatedPrompt }],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });

      return response.data;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get chat completion');
    }
  },

  async generateSpeech(text) {
    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const validatedText = validateInput(text);

    try {
      rateLimiter.addRequest();
      const response = await stableLMClient.post('/audio/speech', {
        text: validatedText,
        voice: 'default'
      });

      return response.data;
    } catch (error) {
      console.error('Speech generation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate speech');
    }
  },

  async generateImage(description) {
    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const validatedDescription = validateInput(description);

    try {
      rateLimiter.addRequest();
      const response = await stableLMClient.post('/images/generations', {
        prompt: validatedDescription,
        n: 1,
        size: '512x512'
      });

      return response.data;
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to generate image');
    }
  }
}; 