/* Tailwind CDN config
   - This file is loaded BEFORE https://cdn.tailwindcss.com
   - For static sites without build tools, Tailwind reads `window.tailwind.config` at runtime.
*/

// Ensure a global `tailwind` object exists BEFORE the CDN script runs.
// The CDN script reads from `tailwind.config` during initialization.
window.tailwind = {
  config: {
  theme: {
    extend: {
      colors: {
        "theme-1": "#2D4005",
        "theme-2": "#95A614",
        "theme-3": "#F28705",
        "theme-4": "#D95829",
        "theme-5": "#A61212",
      },
    },
  },
  },
};

