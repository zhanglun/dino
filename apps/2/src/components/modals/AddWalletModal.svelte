<script lang="ts">
	import type { SvelteComponent } from 'svelte';

	// Stores
	import { getModalStore } from '@skeletonlabs/skeleton';

	// Props
  const { parent }: { parent: SvelteComponent } = $props();

	const modalStore = getModalStore();

	// Form Data
	let formData = $state({
		avatar: '',
		name: '',
		address: ''
  });

	const disabled = $derived(formData.name.length === 0 || formData.address.length === 0 || formData.name.length > 24);
  const txtLength = $derived(formData.name.length);

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
    if (disabled) return;
		if ($modalStore[0].response) $modalStore[0].response(formData);
		modalStore.close();
	}

	// Base Classes
	const cBase = 'card w-modal shadow-xl space-y-4 relative';
	const cHeader = 'text-xl font-bold px-8 pt-10';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
	<div class={cBase}>
		<iconify-icon icon="fluent:dismiss-24-regular" class="absolute right-8 top-8" height="22"></iconify-icon>

		<header class={cHeader}>New Wallet</header>
		<div class="flex flex-col gap-6 p-8">
			<div>
				<div>Portfilio Avatar</div>
				<div class="flex flex-row items-center justify-between">
					<div>Portfilio Avatar</div>
					<button class="btn variant-filled-primary">Change</button>
				</div>
			</div>
			<div>
				<label class="label">
					<span>Wallet Address</span>
					<input
						class="input"
						type="text"
						placeholder="Enter public address"
						bind:value={formData.address}
					/>
					<div class="text-xs text-gray-500">
						We are only requesting view permissions. This does not give us access to your private
						keys nor the ability to move your assets.
					</div>
				</label>
			</div>
			<div>
				<label class="label">
					<span>Portfilio Name</span>
					<input
						class="input {txtLength > 24 ? 'input-error' : ''}"
						type="text"
						placeholder="Enter your portfilio name"
						bind:value={formData.name}
					/>
					<div class="text-xs text-gray-500">{txtLength}/24 characters</div>
				</label>
			</div>
			<div class="modal-footer {parent.regionFooter}">
				<button disabled={disabled} class="btn w-full {parent.buttonPositive}" on:click={onFormSubmit}
					>{parent.buttonTextSubmit}</button
				>
			</div>
		</div>
	</div>
{/if}
