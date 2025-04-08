# React SPA for Notes App

Used during AI prompting recap for Gen AI integration with OpenAI API

## Project Plan

For a detailed breakdown of the implementation plan, please see [Project Plan](docs/project-plan.md).

## Setup

- Fork repo
- Clone into your computer
- `cd` into working directory
- `npm i` to install dependencies
- create a `.env.development.local` file with two variables:
  - `VITE_NOTES_API` set to `http://localhost:8080` assuming your backend API is running on port 8080
  - `VITE_OPENAI_API` set to `https://api.openai.com/v1`
  - `VITE_OPENAI_API_KEY` set to your OpenAI API key
- The server defaults to port `5173`, although you can override this in the script sections in `package.json`

## Commands

- `npm run dev`: Starts development server, pulling environment variables from `.env.development.local` file
- `npm run build`: Build app with enviroment set to `.env.production.local`
- `npm start`: Production server

## Usage

- The application has its entry point at `src/main.jsx`
- `App.jsx` return a `RouterProvider` with 2 routes:
  - `/` => `Diary`
  - `/notes` => `SchoolNotes`
- The code is organised as follows:
  - There's a path resolution alias `@/` => `.src/` to avoid relative paths in imports. This is setup in `vite.config.js` to inform Vite, and `jsconfig.json` to inform the TS compiler in the editor.
    - e.g:
    ```javascript
    // src/pages/Diary.jsx
    import { CreateEntry, MoodAIAnalysis, EntriesList } from '@/components/Diary';
    // instead of
    import { CreateEntry, MoodAIAnalysis, EntriesList } from '../components/Diary';
    ```
  - For organisation sake, components are grouped in directories, and imported and re-exported from an `index.js` file:
    ```javascript
    // src/pages/Diary.jsx
    // This allows us to do this
    import { CreateEntry, MoodAIAnalysis, EntriesList } from '@/components/Diary';
    // instead of this
    import CreateEntry from '@/components/Diary/CreateEntry';
    import MoodAIAnalysis from '@/components/Diary/MoodAIAnalysis';
    import EntriesList from '@/components/Diary/EntriesList';
    // Ain't nobody got time for that
    ```
  - `pages`: React components that are directly mapped to a route.
  - `components`: React components used in pages
  - `layouts`: React components that are used as layouts in routes and render `Outlet`
  - `TailwindCSS` and `DaisyUI` are configured for styles <3
