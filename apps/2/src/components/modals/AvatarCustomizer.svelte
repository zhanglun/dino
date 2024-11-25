<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';

  const props = $props();
  let avatar = $state(props.avatar);
  let selectedColor = $state('#4F46E5'); // 默认选择一个颜色
  let selectedEmoji = $state('fluent-emoji-face-grin'); // 默认emoji

  // 预定义8种颜色
  const colors = [
    '#4F46E5', // Indigo
    '#2563EB', // Blue
    '#DC2626', // Red
    '#16A34A', // Green
    '#CA8A04', // Yellow
    '#9333EA', // Purple
    '#DB2777', // Pink
    '#475569' // Gray
  ];

  // Fluent Emoji 图标
  const emojis = [
    'fluent-emoji:beaming-face-with-smiling-eyes',
    'fluent-emoji:alien',
    'fluent-emoji:astonished-face',
    'fluent-emoji:zany-face',
    'fluent-emoji:face-with-spiral-eyes',
    'fluent-emoji:partying-face',
    'fluent-emoji:face-vomiting',
    'fluent-emoji:skull',

    'fluent-emoji:lion',
    'fluent-emoji:panda',
    'fluent-emoji:cat-face',
    'fluent-emoji:frog',
    'fluent-emoji:pig-face',
    'fluent-emoji:unicorn',
    'fluent-emoji:cow-face',
    'fluent-emoji:chicken',

    'fluent-emoji:sun-with-face',
    'fluent-emoji:first-quarter-moon-face',
    'fluent-emoji:sparkles',
    'fluent-emoji:four-leaf-clover',
    'fluent-emoji:sparkling-heart',
    'fluent-emoji:sunflower',
    'fluent-emoji:rainbow',
    'fluent-emoji:cactus',

    'fluent-emoji:banana',
    'fluent-emoji:kiwi-fruit',
    'fluent-emoji:cherries',
    'fluent-emoji:watermelon',
    'fluent-emoji:cookie',
    'fluent-emoji:pizza',
    'fluent-emoji:cheese-wedge',
    'fluent-emoji:hamburger',

    'fluent-emoji:dvd',
    'fluent-emoji:magnet',
    'fluent-emoji:crown',
    'fluent-emoji:bathtub',
    'fluent-emoji:yen-banknote',
    'fluent-emoji:dollar-banknote',
    'fluent-emoji:coin',
    'fluent-emoji:dna',

  ];

  function handleSave() {
    dispatch('save', {
      emoji: selectedEmoji,
      color: selectedColor
    });
  }
</script>

<div class="flex flex-col gap-6 p-4">
  <!-- Avatar Preview -->
  <div class="flex justify-center">
    <div
      class="flex h-20 w-20 items-center justify-center rounded-full"
      style="background-color: {selectedColor}"
    >
      <iconify-icon icon={selectedEmoji} width="32" height="32"></iconify-icon>
    </div>
  </div>

  <!-- Color Selection -->
  <div>
    <div class="mb-2 text-sm font-medium">Select Color</div>
    <div class="flex flex-wrap justify-center gap-4">
      {#each colors as color}
        <button
          class="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 {selectedColor ===
          color
            ? 'border-white'
            : 'border-transparent'}"
          style="background-color: {color}"
          on:click={() => (selectedColor = color)}
        />
      {/each}
    </div>
  </div>

  <!-- Emoji Selection -->
  <div>
    <div class="mb-2 text-sm font-medium">Select Emoji</div>
    <div class="grid grid-cols-8 gap-2">
      {#each emojis as emoji}
        <button
          class="hover:bg-surface-600 flex h-10 w-10 items-center justify-center rounded-lg transition-colors {selectedEmoji ===
          emoji
            ? 'bg-surface-600'
            : ''}"
          on:click={() => (selectedEmoji = emoji)}
        >
          <iconify-icon icon={emoji} width="24" height="24"></iconify-icon>
        </button>
      {/each}
    </div>
  </div>

  <!-- Save Button -->
  <button class="btn variant-filled-primary w-full" on:click={handleSave}> Save </button>
</div>
