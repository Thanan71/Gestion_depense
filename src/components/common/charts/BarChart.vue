<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

Chart.register(...registerables)

const canvas = ref<HTMLCanvasElement>()
let chart: Chart<'bar'> | undefined

const renderChart = () => {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: [
        {
          label: 'Budget utilisé',
          data: props.values,
          borderRadius: 8,
          backgroundColor: '#0f766e'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => `${value}%` }
        }
      }
    }
  })
}

onMounted(renderChart)
onBeforeUnmount(() => chart?.destroy())
watch(() => [props.labels, props.values], renderChart, { deep: true })
</script>

<template>
  <div style="height: 240px">
    <canvas ref="canvas" aria-label="Graphique en barres" role="img" />
  </div>
</template>
