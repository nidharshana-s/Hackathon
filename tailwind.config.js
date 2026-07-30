/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#12161A',
        panel: '#1B2229',
        panelLine: '#2A333C',
        steel: '#6E8A99',
        amber: '#F2A93B',
        rust: '#E2612F',
        teal: '#2FD3B8',
        ink: '#E7EDF2',
        inkDim: '#8B9AA6',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
