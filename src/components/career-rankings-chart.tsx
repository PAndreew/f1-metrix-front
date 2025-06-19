// components/charts/CareerRankingsChart.tsx
"use client";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface CareerRankingDataPoint {
  year: number;
  rank: number | null;
  score?: number | null; // Optional score for tooltip
}

interface CareerRankingsChartProps {
  data: CareerRankingDataPoint[];
  driverName: string;
}

export function CareerRankingsChart({ data, driverName }: CareerRankingsChartProps) {
  const chartData = {
    labels: data.map(d => d.year.toString()),
    datasets: [
      {
        label: `${driverName}'s Yearly Rank`,
        data: data.map(d => d.rank),
        borderColor: 'rgb(239, 68, 68)', // Red-500
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.1,
        fill: false, // Or true if you want area fill
        pointRadius: 4,
        pointHoverRadius: 6,
        // For line charts, 'stepped: true' can look good for rankings if they don't change mid-year
        // stepped: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const, labels: { color: '#e2e8f0' } },
      title: { display: true, text: `${driverName}'s Career Ranking Trajectory`, color: '#e2e8f0' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = `Rank: ${context.parsed.y}`;
            const dataIndex = context.dataIndex;
            if (data[dataIndex] && data[dataIndex].score !== undefined && data[dataIndex].score !== null) {
                label += ` (Score: ${data[dataIndex].score?.toFixed(3)})`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.2)' } },
      y: {
        reverse: true, // Lower rank is better
        ticks: { color: '#94a3b8', stepSize: 1 }, // Adjust stepSize if ranks are sparse
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        title: { display: true, text: 'Rank (Lower is Better)', color: '#94a3b8' }
      },
    },
  };

  return <Line options={options} data={chartData} />;
}