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
    '#475569'  // Gray
  ];

  // Fluent Emoji 图标
  const emojis = [
    'fluent-emoji:beaming-face-with-smiling-eyes',
    'fluent-emoji:alien',
    'fluent-emoji:angry-face-with-horns',
    'fluent-emoji:angry-face',
    'fluent-emoji:astonished-face',
    'fluent-emoji:zany-face',
    'fluent-emoji:smiling-face-with-heart',
    'fluent-emoji:skull',
    'fluent-emoji:orange-heart',
    'fluent-emoji:ant',
    'fluent-emoji:lion',
    'fluent-emoji:panda',
    'fluent-emoji:cat-face',
    'fluent-emoji:fox-face',
    'fluent-emoji:frog',
    'fluent-emoji:pig',
    'fluent-emoji-rainbow',
    'fluent-emoji-sun',
    'fluent-emoji-crescent-moon',
    'fluent-emoji-star',
    'fluent-emoji-four-leaf-clover',
    'fluent-emoji-cherry-blossom',
    'fluent-emoji-hibiscus',
    'fluent-emoji-guitar',
    'fluent-emoji-video-game',
    'fluent-emoji-soccer-ball',
    'fluent-emoji-game-die',
    'fluent-emoji-direct-hit',
    'fluent-emoji-artist-palette',
    'fluent-emoji-performing-arts',
    'fluent-emoji-rocket',
    'fluent-emoji-sparkles',
    'fluent-emoji-dizzy',
    'fluent-emoji-glowing-star',
    'fluent-emoji-high-voltage',
    'fluent-emoji-fire',
    'fluent-emoji-light-bulb'
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
      class="w-20 h-20 rounded-full flex items-center justify-center"
      style="background-color: {selectedColor}"
    >
      <iconify-icon icon={selectedEmoji} width="32" height="32"></iconify-icon>
    </div>
  </div>

  <!-- Color Selection -->
  <div>
    <div class="text-sm font-medium mb-2">Select Color</div>
    <div class="flex gap-4 flex-wrap justify-center">
      {#each colors as color}
        <button
          class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 {selectedColor === color ? 'border-white' : 'border-transparent'}"
          style="background-color: {color}"
          on:click={() => (selectedColor = color)}
        />
      {/each}
    </div>
  </div>

  <!-- Emoji Selection -->
  <div>
    <div class="text-sm font-medium mb-2">Select Emoji</div>
    <div class="grid grid-cols-10 gap-2">
      {#each emojis as emoji}
        <button
          class="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-surface-600 transition-colors {selectedEmoji === emoji ? 'bg-surface-600' : ''}"
          on:click={() => (selectedEmoji = emoji)}
        >
          <iconify-icon icon={emoji} width="24" height="24"></iconify-icon>
        </button>
      {/each}
    </div>
  </div>

  <!-- Save Button -->
  <button
    class="btn variant-filled-primary w-full"
    on:click={handleSave}
  >
    Save
  </button>
</div>
