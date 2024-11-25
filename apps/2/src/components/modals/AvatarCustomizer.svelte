<script lang="ts" module>
  // 预定义8种颜色，用于emoji背景
  export const colors = [
    '#6B7280', // 深灰
    '#60A5FA', // 天蓝
    '#34D399', // 薄荷绿
    '#FBBF24', // 金黄
    '#F87171', // 珊瑚红
    '#A78BFA', // 淡紫
    '#EC4899', // 粉红
    '#14B8A6' // 青绿
  ];

  // Fluent Emoji 图标
  export const emojis = [
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
    'fluent-emoji:dna'
  ];

  export function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  export function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
</script>

<script lang="ts">
  const props = $props<{
    color?: string;
    emoji?: string;
    onSave: (data: { color: string; emoji: string }) => void;
  }>();
  let selectedColor = $state(props.color || colors[0]); // 默认选择一个颜色
  let selectedEmoji = $state(props.emoji || emojis[0]); // 默认emoji

  function handleSave() {
    props.onSave({ color: selectedColor, emoji: selectedEmoji });
  }
</script>

<div class="flex flex-col gap-8">
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
    <div class="flex flex-wrap justify-center gap-4">
      {#each colors as color}
        <button
          class="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 {selectedColor ===
          color
            ? 'border-white'
            : 'border-transparent'}"
          style="background-color: {color}"
          onclick={() => (selectedColor = color)}
          aria-label="button"
        ></button>
      {/each}
    </div>
  </div>

  <!-- Emoji Selection -->
  <div>
    <div class="mb-3 text-sm font-medium">Select Emoji</div>
    <div class="grid grid-cols-8 gap-4">
      {#each emojis as emoji}
        <button
          class="hover:bg-surface-600 flex h-10 w-10 items-center justify-center rounded-lg transition-colors {selectedEmoji ===
          emoji
            ? 'bg-surface-600'
            : ''}"
          onclick={() => (selectedEmoji = emoji)}
          aria-label="button"
        >
          <iconify-icon icon={emoji} width="34" height="34"></iconify-icon>
        </button>
      {/each}
    </div>
  </div>

  <!-- Save Button -->
  <button class="btn variant-filled-primary w-full" onclick={handleSave}> Save </button>
</div>
