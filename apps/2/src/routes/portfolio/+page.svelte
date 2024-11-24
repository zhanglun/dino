<script lang="ts">
	import Icon from '@iconify/svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';

	const portfolioList = Math.random() > 0.5 ? ['Portfolio A', 'Portfolio B', 'Portfolio C'] : [];
	let showDialog = false;

	function toggleDialog() {
		showDialog = !showDialog;
	}
</script>

<section>
	<picture>
		<source srcset={welcome} type="image/webp" />
		<img src={welcomeFallback} alt="Welcome" />
	</picture>
	<h1>Let's get started with your first portfolio!</h1>
	<h2>Track profits, losses and valuation all in one place.</h2>

	<div on:click={toggleDialog} class="add-address">
		<Icon icon="fluent-color:add-circle-30" />
		<div>
			<div class="font-bold">Add Your Wallet</div>
			<div class="text-sm text-surface-400">
				Simply enter your wallet address (no signature needed!) and we'll sync it right away.
			</div>
		</div>
	</div>
</section>

<style>
	.add-address {
		@apply w-full cursor-pointer rounded-xl border border-surface-100 p-6 transition-all duration-300;
		@apply hover:bg-surface-50 hover:border-surface-200;
		@apply flex flex-row items-center;
		@apply gap-5;
	}
</style>
