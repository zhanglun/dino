<script lang="ts">
  import type { SvelteComponent } from 'svelte';
  import { fade } from 'svelte/transition';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import AvatarCustomizer, { getRandomColor, getRandomEmoji } from './AvatarCustomizer.svelte';
  import { crossfade } from 'svelte/transition';
  const [send, receive] = crossfade({
    duration: 260,
    fallback(node, params) {
      return {
        duration: 260,
        css: t => `
          opacity: ${t};
        `
      };
    }
  });


  const modalStore = getModalStore();
  const { parent, color, emoji, name } = $props<{
    parent: SvelteComponent;
    color?: string;
    emoji?: string;
    name?: string;
  }>();
  let formData = $state({
    color: color || getRandomColor(),
    emoji: emoji || getRandomEmoji(),
    name: name || '',
    address: ''
  });
  let showAvatars = $state(false);

  const disabled = $derived(
    formData.name.length === 0 || formData.address.length === 0 || formData.name.length > 24
  );
  const txtLength = $derived(formData.name.length);

  function updateAvatarWhenCustomizerSaves(data: any) {
    formData.color = data.color;
    formData.emoji = data.emoji;
    showAvatars = false;
  }

  function onFormSubmit(): void {
    if (disabled) return;
    if ($modalStore[0].response) $modalStore[0].response(formData);

    modalStore.close();
  }

  function handleChangeAvatar() {
    showAvatars = true;
  }

  // Base Classes
  const cBase = 'card shadow-xl relative w-[490px]';
  const cHeader = 'text-xl font-bold px-8 pt-10 flex gap-4 items-center text-center';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
  <div class={cBase} >
    {#if showAvatars}
      <div key="avatars" transition:crossfade|local>
        <header class={cHeader}>
          <iconify-icon
            icon="fluent:arrow-left-12-regular"
            class="cursor-pointer text-gray-600 hover:text-gray-800"
            onclick={() => (showAvatars = false)}
          ></iconify-icon>
          Change Avatar
        </header>
        <div class="flex flex-col gap-6 p-8">
          <div>Portfolio Avatar</div>
          <div class="mt-3 flex flex-row items-center justify-between">
            <AvatarCustomizer {color} {emoji} onSave={updateAvatarWhenCustomizerSaves} />
          </div>
        </div>
      </div>
    {:else}
      <div key="form" transition:crossfade|local>
        <iconify-icon
          icon="fluent:dismiss-24-regular"
          class="absolute right-8 top-8 cursor-pointer text-gray-600 hover:text-gray-800"
          height="22"
          onclick={() => modalStore.close()}
        ></iconify-icon>

        <header class={cHeader}>New Wallet</header>
        <div class="flex flex-col gap-6 p-8">
          <div>
            <div>Portfolio Avatar</div>
            <div class="mt-2 flex flex-row items-center justify-between">
              <div>
                <div
                  class="flex h-20 w-20 items-center justify-center rounded-full"
                  style="background-color: {formData.color}"
                >
                  <iconify-icon icon={formData.emoji} width="32" height="32"></iconify-icon>
                </div>
              </div>
              <button class="variant-filled-primary btn" onclick={handleChangeAvatar}>Change</button
              >
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
                We are only requesting view permissions. This does not give us access to your
                private keys nor the ability to move your assets.
              </div>
            </label>
          </div>
          <div>
            <label class="label">
              <span>Portfolio Name</span>
              <input
                class="input {txtLength > 24 ? 'input-error' : ''}"
                type="text"
                placeholder="Enter your portfolio name"
                bind:value={formData.name}
              />
              <div class="text-xs text-gray-500">{txtLength}/24 characters</div>
            </label>
          </div>
          <div class="modal-footer {parent.regionFooter}">
            <button {disabled} class="btn w-full {parent.buttonPositive}" onclick={onFormSubmit}
              >{parent.buttonTextSubmit}</button
            >
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
