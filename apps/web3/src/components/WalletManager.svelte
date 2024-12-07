<script lang="ts">
  import { onMount } from 'svelte';
  import { walletStore, fetchWallets, addWallet, updateWallet, deleteWallet, setCurrentWallet } from '../stores/wallet';
  import type { Wallet } from '../stores/wallet';
  
  let showAddModal = false;
  let newWallet: Partial<Wallet> = {
    name: '',
    address: '',
    color: '#6366f1',
    emoji: '💰'
  };
  
  let editingWallet: Wallet | null = null;
  
  onMount(async () => {
    try {
      await fetchWallets();
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  });
  
  async function handleAddWallet() {
    try {
      if (!newWallet.address || !newWallet.name) {
        return;
      }
      
      await addWallet(newWallet as Wallet);
      showAddModal = false;
      newWallet = {
        name: '',
        address: '',
        color: '#6366f1',
        emoji: '💰'
      };
    } catch (error) {
      console.error('Error adding wallet:', error);
    }
  }
  
  async function handleUpdateWallet() {
    if (!editingWallet) return;
    
    try {
      await updateWallet(editingWallet.address, editingWallet);
      editingWallet = null;
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  }
  
  async function handleDeleteWallet(address: string) {
    if (!confirm('确定要删除这个钱包吗？')) return;
    
    try {
      await deleteWallet(address);
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  }
  
  const emojis = ['💰', '🏦', '💎', '🪙', '💵', '🏛️', '🔐', '🗝️'];
  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#84cc16', // Lime
    '#14b8a6', // Teal
    '#0ea5e9'  // Sky
  ];
</script>

<div class="p-4">
  <!-- 钱包列表 -->
  <div class="space-y-4">
    {#each $walletStore.wallets as wallet (wallet.address)}
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style="background-color: {wallet.color}"
              >
                {wallet.emoji}
              </div>
              <div>
                <h3 class="text-lg font-semibold">{wallet.name}</h3>
                <p class="text-sm opacity-70">{wallet.address}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                class="btn btn-ghost btn-sm"
                on:click={() => editingWallet = { ...wallet }}
              >
                编辑
              </button>
              <button
                class="btn btn-ghost btn-sm text-error"
                on:click={() => handleDeleteWallet(wallet.address)}
              >
                删除
              </button>
              {#if $walletStore.currentWallet?.address !== wallet.address}
                <button
                  class="btn btn-primary btn-sm"
                  on:click={() => setCurrentWallet(wallet)}
                >
                  选择
                </button>
              {:else}
                <span class="badge badge-primary">当前选中</span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  <!-- 添加钱包按钮 -->
  <button
    class="btn btn-primary mt-4"
    on:click={() => showAddModal = true}
  >
    添加钱包
  </button>
  
  <!-- 添加钱包模态框 -->
  {#if showAddModal}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">添加新钱包</h3>
        <form on:submit|preventDefault={handleAddWallet} class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">钱包名称</span>
            </label>
            <input
              type="text"
              bind:value={newWallet.name}
              class="input input-bordered"
              placeholder="输入钱包名称"
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">钱包地址</span>
            </label>
            <input
              type="text"
              bind:value={newWallet.address}
              class="input input-bordered"
              placeholder="输入钱包地址"
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">选择表情</span>
            </label>
            <div class="flex gap-2 flex-wrap">
              {#each emojis as emoji}
                <button
                  type="button"
                  class="btn btn-ghost"
                  class:btn-active={newWallet.emoji === emoji}
                  on:click={() => newWallet.emoji = emoji}
                >
                  {emoji}
                </button>
              {/each}
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">选择颜色</span>
            </label>
            <div class="flex gap-2 flex-wrap">
              {#each colors as color}
                <button
                  type="button"
                  class="w-8 h-8 rounded-full"
                  style="background-color: {color}"
                  class:ring-2={newWallet.color === color}
                  on:click={() => newWallet.color = color}
                />
              {/each}
            </div>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn" on:click={() => showAddModal = false}>
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
  
  <!-- 编辑钱包模态框 -->
  {#if editingWallet}
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">编辑钱包</h3>
        <form on:submit|preventDefault={handleUpdateWallet} class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">钱包名称</span>
            </label>
            <input
              type="text"
              bind:value={editingWallet.name}
              class="input input-bordered"
              placeholder="输入钱包名称"
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">选择表情</span>
            </label>
            <div class="flex gap-2 flex-wrap">
              {#each emojis as emoji}
                <button
                  type="button"
                  class="btn btn-ghost"
                  class:btn-active={editingWallet.emoji === emoji}
                  on:click={() => editingWallet.emoji = emoji}
                >
                  {emoji}
                </button>
              {/each}
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">选择颜色</span>
            </label>
            <div class="flex gap-2 flex-wrap">
              {#each colors as color}
                <button
                  type="button"
                  class="w-8 h-8 rounded-full"
                  style="background-color: {color}"
                  class:ring-2={editingWallet.color === color}
                  on:click={() => editingWallet.color = color}
                />
              {/each}
            </div>
          </div>
          
          <div class="modal-action">
            <button type="button" class="btn" on:click={() => editingWallet = null}>
              取消
            </button>
            <button type="submit" class="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>
