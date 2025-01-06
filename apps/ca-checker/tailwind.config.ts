import { join } from 'path';
import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    // 3. Append the path to the Skeleton package
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
  ],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: 'var(--text-gray-600)'
        }
      }
    }
  },

  plugins: [
    typography,
    forms,
    containerQueries,
    skeleton({
      themes: {
        // Register each theme within this array:
        preset: ['skeleton', 'modern', 'crimson']
      }
    })
  ]
} satisfies Config;
