// components/charts/TopDriverPerYearChart.tsx
'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // For area fill if desired
  TooltipItem,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface TopDriverDataPoint {
  year: number;
  driverName: string;
  score: number | null;
}

interface TopDriverPerYearChartProps {
  data: TopDriverDataPoint[];
}

export function TopDriverPerYearChart({ data }: TopDriverPerYearChartProps) {
  const chartData = {
    labels: data.map(d => d.year.toString()),
    datasets: [
      {
        label: 'Top Driver Score',
        data: data.map(d => d.score),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Optional fill
        tension: 0.1,
        fill: true, // Optional
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Important for fitting in various containers
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#e2e8f0' } // Light text for dark mode
      },
      title: {
        display: true,
        text: 'Top Driver Performance Score Per Year',
        color: '#e2e8f0' // Light text for dark mode
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(3);
            }
            // Add driver name to tooltip
            const dataIndex = context.dataIndex;
            if (data[dataIndex] && data[dataIndex].driverName) {
                label += ` (${data[dataIndex].driverName})`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' }, // Light text for dark mode
        grid: { color: 'rgba(148, 163, 184, 0.2)'}
      },
      y: {
        ticks: { color: '#94a3b8' }, // Light text for dark mode
        grid: { color: 'rgba(148, 163, 184, 0.2)'}
      },
    },
  };

  return <Line options={options} data={chartData} />;
}