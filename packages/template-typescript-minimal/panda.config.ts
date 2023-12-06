import {defineConfig} from '@pandacss/dev'

export default defineConfig({
    // Whether to use css reset
    preflight: true,
    presets: ['@pandacss/dev/presets'],

    // Where to look for your css declarations
    include: ['./app/components/**/*.{ts,tsx,js,jsx}', './app/pages/**/*.{ts,tsx,js,jsx}'],

    // Files to exclude
    exclude: [],

    // Useful for theme customization
    theme: {
        extend: {}
    },

    // The output directory for your css system
    outdir: './app/styled-system'
})
