import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MoodChart = ({ entries }) => {
  // Transform entries into chart data
  const chartData = {
    labels: entries.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Mood Score',
        data: entries.map(entry => {
          // Convert mood to numerical value for charting
          switch (entry.analysis?.mood?.toLowerCase()) {
            case 'positive':
              return 1;
            case 'neutral':
              return 0;
            case 'negative':
              return -1;
            default:
              return 0;
          }
        }),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Mood Analysis Over Time'
      }
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          callback: (value) => {
            switch (value) {
              case 1:
                return 'Positive';
              case 0:
                return 'Neutral';
              case -1:
                return 'Negative';
              default:
                return '';
            }
          }
        }
      }
    }
  };

  return (
    <div className="w-full h-64 mt-4">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MoodChart; 