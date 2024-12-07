<script lang="ts">
  import { walletStore } from '../stores/wallet';
  import WalletManager from '../components/WalletManager.svelte';
  import AssetCard from '../components/AssetCard.svelte';
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold mb-8">Web3 资产管理</h1>
  
  {#if !$walletStore.currentWallet}
    <div class="card bg-base-200 shadow-xl p-6">
      <h2 class="text-2xl font-semibold mb-4">管理钱包</h2>
      <WalletManager />
    </div>
  {:else}
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style="background-color: {$walletStore.currentWallet.color}"
          >
            {$walletStore.currentWallet.emoji}
          </div>
          <div>
            <h2 class="text-2xl font-semibold">{$walletStore.currentWallet.name}</h2>
            <p class="text-sm opacity-70">{$walletStore.currentWallet.address}</p>
          </div>
        </div>
        <button
          class="btn btn-ghost"
          on:click={() => walletStore.update(state => ({ ...state, currentWallet: null }))}
        >
          切换钱包
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each $walletStore.assets as asset (asset.token)}
        <AssetCard {asset} />
      {/each}
    </div>
  {/if}
</div>
