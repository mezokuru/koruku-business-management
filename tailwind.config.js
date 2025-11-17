/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2c3e50',    // Dark slate
        },
        accent: {
          DEFAULT: '#ffd166',     // Gold
        },
        success: {
          DEFAULT: '#27ae60',    // Green
        },
        danger: {
          DEFAULT: '#e74c3c',     // Red
        },
        warning: {
          DEFAULT: '#f39c12',    // Orange
        },
        info: {
          DEFAULT: '#3498db',       // Blue
        },
        muted: {
          DEFAULT: '#7f8c8d',      // Gray
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
      });
    },
  ],
}
