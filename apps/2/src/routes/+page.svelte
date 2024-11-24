<script lang="ts">
  import Counter from './Counter.svelte';
  import welcome from '$lib/images/svelte-welcome.webp';
  import welcomeFallback from '$lib/images/svelte-welcome.png';
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
  <picture>
    <source srcset={welcome} type="image/webp" />
    <img src={welcomeFallback} alt="Welcome" />
  </picture>
  <h1>Let’s get started with your first portfolio!</h1>
  <h2>Track profits, losses and valuation all in one place.</h2>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  h1 {
    width: 100%;
  }
</style>
