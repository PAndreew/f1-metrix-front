// components/charts/DriverAttributesChart.tsx
"use client";

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, TooltipItem, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface AttributeData {
  u0_contrib: number | null;
  u1_year_contrib: number | null;
  age_contrib: number | null;
  exp_contrib: number | null;
}

interface DriverAttributesChartProps {
  data: AttributeData | null | undefined; // Can be null if no data for the year
  year: number;
}

export function DriverAttributesChart({ data, year }: DriverAttributesChartProps) {
  if (!data) {
    return <p className="text-center text-slate-400 py-10">No attribute data available for {year}.</p>;
  }

  const chartData = {
    labels: ['Base Skill (u0)', 'Year Trend (u1*yr)', 'Age Effect', 'Experience Effect'],
    datasets: [
      {
        label: `Performance Attributes for ${year}`,
        data: [
          data.u0_contrib,
          data.u1_year_contrib,
          data.age_contrib,
          data.exp_contrib,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const, // Horizontal bar chart can be nice for this
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Label is already in dataset
      title: { display: true, text: `Driver Performance Attributes Breakdown (${year})`, color: '#e2e8f0' },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            let label = context.dataset.label || '';
            if (label) { label = context.label + ': '; } // Use category label
            if (context.parsed.x !== null) {
              label += context.parsed.x.toFixed(3);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        title: { display: true, text: 'Contribution to Performance Score', color: '#94a3b8' }
      },
      y: { ticks: { color: '#94a3b8' }, grid: { display: false } },
    },
  };

  return <Bar options={options} data={chartData} />;
}