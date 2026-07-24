/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // manosli+ brand tokens (design.md §3)
        void: '#06030B',
        abyss: '#0C0714',
        panel: '#130B21',
        line: '#241A38',
        pulse: '#7C5CFF',
        wave: '#2EE6D6',
        beat: '#FF3D8A',
        spark: '#FFB224',
        ghost: '#F5F2FB',
        mist: '#A79FBE',
        smoke: '#6E6584',
        // shadcn tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'glow-pulse': '0 0 48px rgba(124,92,255,0.35)',
        'glow-wave': '0 0 48px rgba(46,230,214,0.28)',
        'glow-beat': '0 0 48px rgba(255,61,138,0.30)',
        'card-lift': '0 24px 64px rgba(0,0,0,0.5)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'eq-bar': {
          '0%,100%': { transform: 'scaleY(0.25)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'spark-pulse': {
          '0%,100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        'dot-pulse': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        sonar: {
          '0%': { transform: 'scale(0.2)', opacity: '0.8' },
          '53%,100%': { transform: 'scale(3)', opacity: '0' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'scroll-cue': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '45%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '55%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
        'blob-drift': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(6vw,-4vh) scale(1.15)' },
        },
        'hue-shift': {
          from: { filter: 'hue-rotate(-8deg)' },
          to: { filter: 'hue-rotate(8deg)' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        marquee: 'marquee 40s linear infinite',
        'eq-bar': 'eq-bar 0.9s ease-in-out infinite',
        'spark-pulse': 'spark-pulse 2.4s ease-in-out infinite',
        'dot-pulse': 'dot-pulse 2s ease-in-out infinite',
        sonar: 'sonar 3s ease-out infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
        'scroll-cue': 'scroll-cue 1.6s ease-in-out infinite',
        'blob-drift': 'blob-drift 18s ease-in-out infinite alternate',
        'hue-shift': 'hue-shift 12s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
