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

const openAIService = {
  async getChatCompletion(prompt, isJsonResponse = false) {
    validateInput(prompt);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const { data } = await axios.post(
        `${import.meta.env.VITE_OPENAI_API}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          response_format: isJsonResponse ? { type: 'json_object' } : undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          }
        }
      );
      return data;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new APIError(error.response?.data?.error?.message || 'Failed to get response from OpenAI', error.response?.status || 500);
    }
  },

  async *getChatCompletionStream(prompt, signal) {
    validateInput(prompt);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const response = await fetch(`${import.meta.env.VITE_OPENAI_API}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          stream: true
        }),
        signal
      });

      if (!response.ok) {
        throw new APIError(`API request failed: ${response.statusText}`, response.status);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content;
            if (content) yield content;
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new APIError('Request was cancelled', 499);
      }
      console.error('OpenAI Streaming API error:', error);
      throw new APIError(error.message || 'Failed to get streaming response from OpenAI', error.status || 500);
    }
  },

  async generateSpeech(text) {
    validateInput(text);
    
    if (!rateLimiter.canMakeRequest()) {
      throw new APIError('Rate limit exceeded. Please try again later.', 429);
    }
    
    try {
      rateLimiter.addRequest();
      const response = await axios.post(
        `${import.meta.env.VITE_OPENAI_API}/audio/speech`,
        {
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          },
          responseType: 'arraybuffer'  // Important: tell axios to expect binary data
        }
      );
      
      // Create a Blob from the audio data with correct MIME type
      return new Blob([response.data], { type: 'audio/mpeg' });
    } catch (error) {
      console.error('OpenAI TTS error:', error);
      throw new APIError(error.response?.data?.error?.message || 'Failed to generate speech', error.response?.status || 500);
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

export default openAIService; 