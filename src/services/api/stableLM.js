class RateLimiter {
  constructor(maxRequests = 15, timeWindow = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  addRequest() {
    this.requests.push(Date.now());
  }
}

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

const rateLimiter = new RateLimiter();

const MAX_INPUT_LENGTH = 1000;

const stableLMConfig = {
  baseURL: import.meta.env.VITE_STABLE_LM_API,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_STABLE_LM_API_KEY}`
  }
};

export const validateInput = (text) => {
  if (!text) throw new APIError('Input text is required', 400);
  if (text.length > MAX_INPUT_LENGTH) {
    throw new APIError(`Input text must not exceed ${MAX_INPUT_LENGTH} characters`, 400);
  }
};

export const stableLMService = {
  async getChatCompletion(prompt) {
    validateInput(prompt);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const response = await fetch(`${stableLMConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: stableLMConfig.headers,
        body: JSON.stringify({
          model: 'stable-lm-zephyr-3b',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new APIError(`API request failed: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to get chat completion', 500);
    }
  },

  async generateSpeech(text) {
    validateInput(text);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const response = await fetch(`${stableLMConfig.baseURL}/audio/speech`, {
        method: 'POST',
        headers: stableLMConfig.headers,
        body: JSON.stringify({
          text,
          voice_id: 'en-US-1'
        })
      });

      if (!response.ok) {
        throw new APIError(`API request failed: ${response.statusText}`, response.status);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to generate speech', 500);
    }
  },

  async generateImage(description) {
    validateInput(description);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const response = await fetch(`${stableLMConfig.baseURL}/images/generations`, {
        method: 'POST',
        headers: stableLMConfig.headers,
        body: JSON.stringify({
          text_prompts: [{ text: description }],
          cfg_scale: 7,
          height: 512,
          width: 512,
          steps: 30,
          samples: 1
        })
      });

      if (!response.ok) {
        throw new APIError(`API request failed: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to generate image', 500);
    }
  }
}; 