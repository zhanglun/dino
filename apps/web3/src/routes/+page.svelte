<script lang="ts">
  import { wallet } from '../stores/wallet';
  import { onMount } from 'svelte';
  
  let address = '';
  
  function handleAddressSubmit() {
    wallet.set({
      address,
      chainId: 1,
      balance: '0',
      assets: []
    });
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold mb-8">Web3 资产管理</h1>
  
  <div class="card bg-base-200 shadow-xl p-6">
    <h2 class="text-2xl font-semibold mb-4">输入钱包地址</h2>
    <form on:submit|preventDefault={handleAddressSubmit} class="flex gap-4">
      <input
        type="text"
        bind:value={address}
        placeholder="输入以太坊钱包地址"
        class="input input-bordered flex-1"
      />
      <button type="submit" class="btn btn-primary">查询</button>
    </form>
  </div>
  
  {#if $wallet.address}
    <div class="mt-8">
      <h2 class="text-2xl font-semibold mb-4">钱包资产</h2>
      <!-- 资产列表将在这里显示 -->
    </div>
  {/if}
</div>
