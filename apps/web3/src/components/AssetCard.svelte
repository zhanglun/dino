<script lang="ts">
  import type { Asset } from '../stores/wallet';
  import { onMount } from 'svelte';
  
  export let asset: Asset;
  
  const chainNames = {
    1: 'Ethereum',
    56: 'BSC',
    137: 'Polygon',
    // 添加更多链
  };
</script>

<div class="card bg-base-100 shadow-xl p-4">
  <div class="flex justify-between items-start">
    <div>
      <h3 class="text-lg font-semibold">{asset.symbol}</h3>
      <p class="text-sm opacity-70">{chainNames[asset.chainId] || `Chain ${asset.chainId}`}</p>
    </div>
    <div class="text-right">
      <p class="text-lg font-medium">{asset.amount}</p>
      <p class="text-sm text-primary">${asset.value.toFixed(2)}</p>
    </div>
  </div>
</div>
