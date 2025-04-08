import { useRef, useState } from 'react';
import openAIService from '@/services/api/openAI';
import { toast } from 'react-toastify';
import AudioPlayer from './AudioPlayer';

const NotesAISummary = ({ notes }) => {
  const modalRef = useRef(null);
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stream, setStream] = useState(false);

  const handleAISummary = async () => {
    if (notes.length === 0) {
      toast.warning('No notes to summarize');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Please provide a concise summary of these notes in a clear and organized manner:

${notes.map(note => `Title: ${note.title}\nContent: ${note.content}`).join('\n\n')}

Please format the summary with clear sections and bullet points where appropriate.`;

      const response = await openAIService.getChatCompletion(prompt);
      setSummary(response.choices[0].message.content);
    } catch (error) {
      console.error('Summary generation error:', error);
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className='fixed bottom-4 right-4'>
        <button
          onClick={() => modalRef.current.showModal()}
          className='bg-purple-400 hover:bg-purple-300 text-white font-bold py-2 px-4 rounded-full shadow-lg w-10 h-10'
        >
          ✨
        </button>
      </div>
      <dialog id='modal-note' className='modal' ref={modalRef}>
        <div className='modal-box h-[600px] py-0'>
          <div className='modal-action items-center justify-between mb-2'>
            <h1 className='text-2xl text-center'>Get AI Summary</h1>
            <label htmlFor='Stream?' className='flex items-center gap-1'>
              Stream?
              <input
                id='Stream?'
                type='checkbox'
                className='toggle toggle-error'
                checked={stream}
                onChange={() => setStream(p => !p)}
              />
            </label>

            <form method='dialog'>
              <button className='btn'>&times;</button>
            </form>
          </div>
          <div className='flex flex-col items-center gap-3'>
            <div className='textarea textarea-success w-full h-[400px] overflow-y-scroll'>
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : (
                summary
              )}
            </div>
            <button
              className='btn bg-purple-500 hover:bg-purple-400 text-white'
              onClick={handleAISummary}
              disabled={isGenerating || notes.length === 0}
            >
              {isGenerating ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Generating...
                </>
              ) : (
                'Generate Summary ✨'
              )}
            </button>
            {summary && (
              <div className="w-full mt-4">
                <AudioPlayer text={summary} />
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
};

export default NotesAISummary;
