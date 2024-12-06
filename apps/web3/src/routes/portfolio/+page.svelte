<script lang="ts">
  import { onMount } from 'svelte';
  import { wallet, type Asset } from '../../stores/wallet';
  import AssetCard from '../../components/AssetCard.svelte';
  import * as echarts from 'echarts';
  
  let chartDom: HTMLElement;
  let chart: echarts.ECharts;
  
  $: totalValue = $wallet.assets.reduce((sum, asset) => sum + asset.value, 0);
  
  $: chartData = $wallet.assets.map(asset => ({
    name: asset.symbol,
    value: asset.value
  }));
  
  onMount(() => {
    chart = echarts.init(chartDom);
    updateChart();
    
    return () => {
      chart.dispose();
    };
  });
  
  function updateChart() {
    if (!chart) return;
    
    const option = {
      title: {
        text: '资产分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: '70%',
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    chart.setOption(option);
  }
  
  $: if (chart && chartData) {
    updateChart();
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold">资产组合</h1>
    <div class="text-right">
      <p class="text-sm opacity-70">总价值</p>
      <p class="text-2xl font-bold">${totalValue.toFixed(2)}</p>
    </div>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="card bg-base-100 shadow-xl p-6">
      <div bind:this={chartDom} class="w-full h-[400px]"></div>
    </div>
    
    <div class="space-y-4">
      {#each $wallet.assets as asset (asset.token)}
        <AssetCard {asset} />
      {/each}
    </div>
  </div>
</div>
