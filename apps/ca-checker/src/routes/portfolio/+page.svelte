<script lang="ts">
  import welcome from '$lib/images/svelte-welcome.webp';
  import welcomeFallback from '$lib/images/svelte-welcome.png';
  import { getModalStore, type ModalSettings, type ModalComponent } from '@skeletonlabs/skeleton';
  import AddWalletModal from '../../components/modals/AddWalletModal.svelte';

  const modalStore = getModalStore();

  function toggleDialog() {
    const modalComponent: ModalComponent = { ref: AddWalletModal };

    const modal: ModalSettings = {
      type: 'component',
      component: modalComponent,
      response: (result) => {
        console.log(result);
      }
    };
    modalStore.trigger(modal);
  }
</script>

<section>
  <picture>
    <source srcset={welcome} type="image/webp" />
    <img src={welcomeFallback} alt="Welcome" />
  </picture>
  <div class="mb-6">
    <h1 class="mb-3 mt-2 text-center">Let's get started with your first portfolio!</h1>
    <p class="text-surface-400 text-center text-lg">
      Track profits, losses and valuation all in one place.
    </p>
  </div>
  <div class="w-[800px] m-auto">
    <div
      on:click={toggleDialog}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          toggleDialog();
        }
      }}
      class="add-address"
      tabindex="0"
      aria-label="Add Your Wallet"
      role="button"
    >
      <iconify-icon icon="fluent-color:add-circle-32" height="32"></iconify-icon>
      <div>
        <div class="font-bold">Add Your Wallet</div>
        <div class="text-surface-400 text-sm">
          Simply enter your wallet address (no signature needed!) and we'll sync it right away.
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .add-address {
    @apply border-surface-100 w-full cursor-pointer rounded-xl border p-6 transition-all duration-300;
    @apply hover:border-surface-200 hover:bg-surface-50;
    @apply flex flex-row items-center;
    @apply gap-5;
  }
</style>
