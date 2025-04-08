import { useState } from 'react';
import { openAIService } from '@/services/api/openAI';
import { toast } from 'react-toastify';

const MoodAIAnalysis = ({ entries }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeMood = async () => {
    if (entries.length === 0) {
      toast.warning('No entries to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create a prompt that asks for mood analysis in JSON format
      const prompt = `Please analyze the mood and sentiment of these diary entries and return a JSON object with the following structure:
{
  "mood": "positive|negative|neutral",
  "confidence": number between 0 and 1,
  "emotions": ["emotion1", "emotion2", "emotion3"]
}

Here are the entries in chronological order:

${entries.map(entry => `Date: ${new Date(entry.date).toLocaleDateString()}
Content: ${entry.content}`).join('\n\n')}

Please provide your analysis in JSON format.`;

      const response = await openAIService.getChatCompletion(prompt, true);
      const result = JSON.parse(response.choices[0].message.content);
      setAnalysis(result);
    } catch (error) {
      console.error('Mood analysis error:', error);
      toast.error(error.message || 'Failed to analyze mood');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="card bg-base-200 shadow-xl mt-8">
      <div className="card-body">
        <h2 className="card-title">AI Mood Analysis</h2>
        <div className="flex justify-between items-center">
          <button
            className="btn btn-primary"
            onClick={analyzeMood}
            disabled={isAnalyzing || entries.length === 0}
          >
            {isAnalyzing ? (
              <>
                <span className="loading loading-spinner"></span>
                Analyzing...
              </>
            ) : (
              'Analyze Mood'
            )}
          </button>
        </div>

        {analysis && (
          <div className="mt-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Overall Mood</div>
                <div className="stat-value">{analysis.mood || 'Unknown'}</div>
                <div className="stat-desc">
                  Confidence: {analysis.confidence ? Math.round(analysis.confidence * 100) : 0}%
                </div>
              </div>
              
              <div className="stat">
                <div className="stat-title">Key Emotions</div>
                <div className="stat-value text-sm">
                  {analysis.emotions?.join(', ') || 'No emotions detected'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodAIAnalysis;
