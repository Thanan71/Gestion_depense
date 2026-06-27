import type { ChartData } from 'chart.js'

export const useCharts = () => ({
  doughnutDataset(labels: string[], data: number[]): ChartData<'doughnut'> {
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#0f766e', '#2563eb', '#db2777', '#f97316', '#7c3aed', '#64748b']
        }
      ]
    }
  }
})
