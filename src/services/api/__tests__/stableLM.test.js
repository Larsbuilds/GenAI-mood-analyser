import { stableLMService, validateInput } from '../stableLM';

describe('validateInput', () => {
  it('should throw error for empty input', () => {
    expect(() => validateInput('')).toThrow('Input text is required');
  });

  it('should throw error for input exceeding max length', () => {
    const longText = 'a'.repeat(1001);
    expect(() => validateInput(longText)).toThrow('Input text must not exceed 1000 characters');
  });

  it('should not throw error for valid input', () => {
    expect(() => validateInput('Hello')).not.toThrow();
  });
});

describe('stableLMService', () => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should handle chat completion request', async () => {
    const mockResponse = { choices: [{ message: { content: 'Test response' } }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await stableLMService.getChatCompletion('Test prompt');
    expect(result).toEqual(mockResponse);
  });

  it('should handle rate limiting', async () => {
    // Make 16 requests (exceeding the 15 per minute limit)
    const promises = Array(16).fill().map(() => 
      stableLMService.getChatCompletion('Test')
    );

    await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
  });
}); 