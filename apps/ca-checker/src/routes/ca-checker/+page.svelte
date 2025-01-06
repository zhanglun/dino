<script lang="ts">
  import welcome from '$lib/images/svelte-welcome.webp';
  import welcomeFallback from '$lib/images/svelte-welcome.png';

  let inputElem: HTMLInputElement;

  function handleSearch(e: KeyboardEvent) {
    const { key } = e;

    if (key === 'Enter') {
      console.log('🚀 ~ file: +page.svelte:8 ~ handleSearch ~ key:', key);
    }
  }

  $effect(() => {
    inputElem.focus();
  });
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
  <div class="m-auto w-[800px]">
    <div>
      <input
        bind:this={inputElem}
        class="input"
        type="text"
        placeholder="Search"
        onkeyup={handleSearch}
      />
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
