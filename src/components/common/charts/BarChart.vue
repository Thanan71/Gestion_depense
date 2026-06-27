<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { computed } from 'vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    labels: string[]
    values?: number[]
    datasets?: Array<{ label: string; values: number[]; color: string }>
    datasetLabel?: string
    tickSuffix?: string
  }>(),
  {
    datasetLabel: 'Valeur',
    tickSuffix: ''
  }
)

Chart.register(...registerables)

const canvas = ref<HTMLCanvasElement>()
let chart: Chart<'bar'> | undefined
const chartDatasets = computed(() =>
  props.datasets?.length
    ? props.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.values,
        borderRadius: 8,
        backgroundColor: dataset.color
      }))
    : [
        {
          label: props.datasetLabel,
          data: props.values ?? [],
          borderRadius: 8,
          backgroundColor: '#0f766e'
        }
      ]
)

const renderChart = () => {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.labels,
      datasets: chartDatasets.value
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
          ticks: { callback: (value) => `${value}${props.tickSuffix}` }
        }
      }
    }
  })
}

onMounted(renderChart)
onBeforeUnmount(() => chart?.destroy())
watch(() => [props.labels, props.values, props.datasets], renderChart, { deep: true })
</script>

<template>
  <div style="height: 240px">
    <canvas ref="canvas" aria-label="Graphique en barres" role="img" />
  </div>
</template>
