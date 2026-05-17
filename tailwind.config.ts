import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ============================================================
      // TYPOGRAPHY — Geist (one-family Swiss-modernist system)
      // ============================================================
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing, fontWeight }]
        'micro':       ['12px', { lineHeight: '16px', letterSpacing: '0.02em',  fontWeight: '500' }],
        'body-sm':     ['14px', { lineHeight: '20px', letterSpacing: '0',       fontWeight: '400' }],
        'body':        ['16px', { lineHeight: '24px', letterSpacing: '0',       fontWeight: '400' }],
        'body-lg':     ['18px', { lineHeight: '28px', letterSpacing: '-0.005em', fontWeight: '400' }],
        'h3':          ['22px', { lineHeight: '28px', letterSpacing: '-0.01em',  fontWeight: '500' }],
        'h2':          ['28px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '500' }],
        'h1':          ['36px', { lineHeight: '40px', letterSpacing: '-0.02em',  fontWeight: '500' }],
        'display':     ['48px', { lineHeight: '52px', letterSpacing: '-0.025em', fontWeight: '500' }],
        'display-xl':  ['60px', { lineHeight: '64px', letterSpacing: '-0.03em',  fontWeight: '600' }],
        'display-2xl': ['72px', { lineHeight: '76px', letterSpacing: '-0.04em',  fontWeight: '600' }],
      },

      // ============================================================
      // COLOR — direct token mappings (use bg-bg, text-fg, etc.)
      // ============================================================
      colors: {
        // Foundation
        bg:            'hsl(var(--bg))',
        surface:       'hsl(var(--surface))',
        'surface-sub': 'hsl(var(--surface-sub))',
        fg:            'hsl(var(--fg))',
        'fg-muted':    'hsl(var(--fg-muted))',
        'fg-subtle':   'hsl(var(--fg-subtle))',
        trust:         'hsl(var(--trust))',
        'trust-deep':  'hsl(var(--trust-deep))',

        // Brand scale
        brand: {
          50:   'hsl(var(--brand-50))',
          500:  'hsl(var(--brand-500))',
          600:  'hsl(var(--brand-600))',
          DEFAULT: 'hsl(var(--brand-500))',
          glow: 'hsl(var(--brand-glow) / 0.12)',
        },

        // Semantic
        success: { DEFAULT: 'hsl(var(--success))', bg: 'hsl(var(--success-bg))' },
        warning: { DEFAULT: 'hsl(var(--warning))', bg: 'hsl(var(--warning-bg))' },
        danger:  { DEFAULT: 'hsl(var(--danger))',  bg: 'hsl(var(--danger-bg))'  },
        info:    { DEFAULT: 'hsl(var(--info))',    bg: 'hsl(var(--info-bg))'    },

        // shadcn compat (existing components keep working)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },

      // ============================================================
      // RADIUS — hierarchical scale
      // ============================================================
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        full: 'var(--radius-full)',
      },

      // ============================================================
      // ELEVATION
      // ============================================================
      boxShadow: {
        flat:     'var(--shadow-flat)',
        raised:   'var(--shadow-raised)',
        floating: 'var(--shadow-floating)',
        popover:  'var(--shadow-popover)',
        modal:    'var(--shadow-modal)',
      },

      // ============================================================
      // MOTION
      // ============================================================
      transitionTimingFunction: {
        'enter':        'cubic-bezier(0.16, 1, 0.3, 1)',
        'exit':         'cubic-bezier(0.7, 0, 0.84, 0)',
        'standard':     'cubic-bezier(0.65, 0, 0.35, 1)',
        'atmospheric':  'cubic-bezier(0.83, 0, 0.17, 1)',
        'out-expo':     'cubic-bezier(0.16, 1, 0.3, 1)', // legacy alias
      },
      transitionDuration: {
        instant:      '0ms',
        micro:        '100ms',
        fast:         '200ms',
        base:         '400ms',
        slow:         '700ms',
        atmospheric:  '1500ms',
      },

      // ============================================================
      // SPACING — semantic tokens layered over Tailwind scale
      // ============================================================
      spacing: {
        'section-y-public': 'var(--space-section-y-public)',
        'section-y-admin':  'var(--space-section-y-admin)',
        'card-x': 'var(--space-card-x)',
        'card-y': 'var(--space-card-y)',
      },

      // ============================================================
      // KEYFRAMES / ANIMATIONS (existing + new)
      // ============================================================
      keyframes: {
        'marquee-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - 3rem))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - 2rem))' },
        },
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'marquee-scroll':   'marquee-scroll var(--duration, 30s) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration, 30s) linear infinite',
        'shimmer-slide':    'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around':      'spin-around calc(var(--speed) * 2) infinite linear',
        'glow-pulse':       'glow-pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
