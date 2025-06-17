'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define a type for your driver ranking data
interface DriverRanking {
  id: number;
  driverid: number;
  year: number;
  yearly_performance_score: number | null;
  u0_contrib: number | null;
  u1_year_contrib: number | null;
  age_contrib: number | null;
  exp_contrib: number | null;
  forename: string | null;
  surname: string | null;
  yearly_rank: number | null;
}

interface DriverCardProps {
  driver: DriverRanking;
  rank: number; // Overall rank in the list
}

export function DriverCard({ driver, rank }: DriverCardProps) {
  const chartData = {
    labels: ['Base Skill (u0)', 'Year Trend (u1*yr)', 'Age', 'Experience'],
    datasets: [
      {
        label: 'Performance Contribution',
        data: [
          driver.u0_contrib,
          driver.u1_year_contrib,
          driver.age_contrib,
          driver.exp_contrib,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Performance Score Breakdown' },
    },
    scales: {
        y: { beginAtZero: true } // Or adjust based on your data range
    }
  };

  return (
    <Card className='bg-slate-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col group text-white'>
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span>{rank}. {driver.forename} {driver.surname}</span>
          <span>Score: {driver.yearly_performance_score?.toFixed(3)}</span>
        </CardTitle>
        <CardDescription className="text-slate-300">Rank in {driver.year}: {driver.yearly_rank?.toFixed(0)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details">
            <AccordionTrigger>View Details & Breakdown</AccordionTrigger>
            <AccordionContent>
              <p>Base Skill (u0): {driver.u0_contrib?.toFixed(3)}</p>
              <p>Year Trend (u1*yr): {driver.u1_year_contrib?.toFixed(3)}</p>
              <p>Age Contribution: {driver.age_contrib?.toFixed(3)}</p>
              <p>Experience Contribution: {driver.exp_contrib?.toFixed(3)}</p>
              <div className="mt-4 h-64"> {/* Constrain chart height */}
                <Bar data={chartData} options={chartOptions} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}