# Notes App with OpenAI API Integration

A modern web application for managing diary entries and school notes, enhanced with AI capabilities.

## Features

- **Diary Management**
  - Create and view diary entries
  - Mood analysis using AI
  - Visual mood tracking with charts
  - Placeholder images for entries without images

- **School Notes**
  - Create and organize study notes
  - AI-powered summary generation
  - Audio summary generation (text-to-speech)
  - Interactive audio player with progress tracking

- **AI Integration**
  - Mood analysis and visualization
  - Smart note summarization
  - Text-to-speech conversion
  - Rate limiting and error handling

## Tech Stack

- React + Vite
- TailwindCSS + DaisyUI
- Chart.js for visualizations
- OpenAI API integration
- Axios for API requests

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.development.local` with:
   ```
   VITE_NOTES_API=http://localhost:3000
   VITE_OPENAI_API=https://api.openai.com/v1
   VITE_OPENAI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/components/` - Reusable UI components
  - `Diary/` - Diary-related components
  - `Notes/` - School notes components
- `src/services/` - API integration services
- `src/pages/` - Main application pages
- `src/layouts/` - Page layouts and navigation

## Recent Updates

- Added audio summary feature with text-to-speech
- Implemented mood visualization charts
- Added placeholder images for entries
- Fixed button positioning and consistency
- Improved error handling and user feedback

## Next Steps

- Implement streaming response support
- Add accessibility improvements
- Write comprehensive tests
- Add API documentation
- Optimize performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
