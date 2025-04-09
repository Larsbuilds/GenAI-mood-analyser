import { useState, useEffect, useRef } from 'react';
import speechService from '@/services/api/speech';
import { toast } from 'react-toastify';

const AudioPlayer = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const progressInterval = useRef(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    setIsSupported('speechSynthesis' in window);
    
    // Clean up speech synthesis when component unmounts
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      speechService.stop();
    };
  }, []);

  const togglePlay = async () => {
    if (!isSupported) {
      toast.error('Speech synthesis is not supported in your browser');
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        speechService.resume();
        setIsPaused(false);
      } else {
        speechService.pause();
        setIsPaused(true);
      }
    } else {
      try {
        setIsPlaying(true);
        setProgress(0);
        
        // Estimate duration based on text length (roughly 150 words per minute)
        const words = text.split(/\s+/).length;
        const estimatedDuration = (words / 150) * 60 * 1000; // in milliseconds
        
        // Update progress every 100ms
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        
        progressInterval.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval.current);
              return 100;
            }
            return prev + (100 / (estimatedDuration / 100));
          });
        }, 100);

        await speechService.speak(text);
        
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        setProgress(100);
      } catch (error) {
        console.error('Speech error:', error);
        if (error.message !== 'Speech synthesis failed: interrupted') {
          toast.error(error.message || 'Failed to play audio');
        }
      } finally {
        setIsPlaying(false);
        setIsPaused(false);
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }
    }
  };

  const stop = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    speechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 bg-base-200 rounded-lg">
        <p className="text-error">Speech synthesis is not supported in your browser</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-base-200 rounded-lg">
      <div className="flex gap-2">
        <button
          onClick={togglePlay}
          className="btn btn-circle btn-primary"
          aria-label={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
          disabled={!text}
        >
          {isPlaying ? (
            isPaused ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        <button
          onClick={stop}
          className="btn btn-circle btn-ghost"
          aria-label="Stop"
          disabled={!isPlaying}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-base-content/70 mb-1">
          <span>{Math.round(progress)}%</span>
        </div>
        <progress 
          className="progress progress-primary w-full" 
          value={progress} 
          max="100"
        ></progress>
      </div>
    </div>
  );
};

export default AudioPlayer; 