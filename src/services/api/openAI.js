import axios from 'axios';

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

const openAIConfig = {
  baseURL: import.meta.env.VITE_OPENAI_API,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  }
};

export const validateInput = (text) => {
  if (!text) throw new APIError('Input text is required', 400);
  if (text.length > MAX_INPUT_LENGTH) {
    throw new APIError(`Input text must not exceed ${MAX_INPUT_LENGTH} characters`, 400);
  }
};

export const openAIService = {
  async getChatCompletion(prompt, isJsonResponse = false) {
    validateInput(prompt);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const response = await axios.post(`${openAIConfig.baseURL}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        ...(isJsonResponse && { response_format: { type: "json_object" } })
      }, {
        headers: openAIConfig.headers
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new APIError(error.response.data.error?.message || 'API request failed', error.response.status);
      }
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
      const response = await axios.post(`${openAIConfig.baseURL}/audio/speech`, {
        model: 'tts-1',
        input: text,
        voice: 'alloy'
      }, {
        headers: openAIConfig.headers,
        responseType: 'blob'
      });

      return URL.createObjectURL(response.data);
    } catch (error) {
      if (error.response) {
        throw new APIError(error.response.data.error?.message || 'API request failed', error.response.status);
      }
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
      const response = await axios.post(`${openAIConfig.baseURL}/images/generations`, {
        model: 'dall-e-3',
        prompt: description,
        n: 1,
        size: '1024x1024'
      }, {
        headers: openAIConfig.headers
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new APIError(error.response.data.error?.message || 'API request failed', error.response.status);
      }
      throw new APIError('Failed to generate image', 500);
    }
  }
}; 