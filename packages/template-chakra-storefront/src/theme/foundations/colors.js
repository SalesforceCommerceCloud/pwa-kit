/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Base color tokens
const baseColors = {
    transparent: {
        value: 'transparent'
    },
    current: {
        value: 'currentColor'
    },
    black: {
        value: '#000000'
    },
    white: {
        value: '#FFFFFF'
    },

    whiteAlpha: {
        50: {value: 'rgba(255, 255, 255, 0.04)'},
        100: {value: 'rgba(255, 255, 255, 0.06)'},
        200: {value: 'rgba(255, 255, 255, 0.08)'},
        300: {value: 'rgba(255, 255, 255, 0.16)'},
        400: {value: 'rgba(255, 255, 255, 0.24)'},
        500: {value: 'rgba(255, 255, 255, 0.36)'},
        600: {value: 'rgba(255, 255, 255, 0.48)'},
        700: {value: 'rgba(255, 255, 255, 0.64)'},
        800: {value: 'rgba(255, 255, 255, 0.80)'},
        900: {value: 'rgba(255, 255, 255, 0.92)'}
    },

    blackAlpha: {
        50: {value: 'rgba(0, 0, 0, 0.04)'},
        100: {value: 'rgba(0, 0, 0, 0.06)'},
        200: {value: 'rgba(0, 0, 0, 0.08)'},
        300: {value: 'rgba(0, 0, 0, 0.16)'},
        400: {value: 'rgba(0, 0, 0, 0.24)'},
        500: {value: 'rgba(0, 0, 0, 0.36)'},
        600: {value: 'rgba(0, 0, 0, 0.48)'},
        700: {value: 'rgba(0, 0, 0, 0.64)'},
        800: {value: 'rgba(0, 0, 0, 0.80)'},
        900: {value: 'rgba(0, 0, 0, 0.92)'}
    },

    gray: {
        50: {value: '#F3F3F3'},
        100: {value: '#E5E5E5'},
        200: {value: '#C9C9C9'},
        300: {value: '#AEAEAE'},
        400: {value: '#A0A0A0'},
        500: {value: '#939393'},
        600: {value: '#747474'},
        700: {value: '#5C5C5C'},
        800: {value: '#444444'},
        900: {value: '#181818'}
    },

    red: {
        50: {value: '#FEF1EE'},
        100: {value: '#FEDED8'},
        200: {value: '#FEB8AB'},
        300: {value: '#FE8F7D'},
        400: {value: '#FE7765'},
        500: {value: '#FE5C4C'},
        600: {value: '#EA001E'},
        700: {value: '#BA0517'},
        800: {value: '#8E030F'},
        900: {value: '#640103'}
    },

    orange: {
        50: {value: '#FEF1ED'},
        100: {value: '#FFDED5'},
        200: {value: '#FEB9A5'},
        300: {value: '#FF906E'},
        400: {value: '#FF784F'},
        500: {value: '#FF5D2D'},
        600: {value: '#D83A00'},
        700: {value: '#AA3001'},
        800: {value: '#7E2600'},
        900: {value: '#541D01'}
    },

    yellow: {
        50: {value: '#FBF3E0'},
        100: {value: '#F9E3B6'},
        200: {value: '#FCC003'},
        300: {value: '#E4A201'},
        400: {value: '#D79304'},
        500: {value: '#CA8501'},
        600: {value: '#A86403'},
        700: {value: '#8C4B02'},
        800: {value: '#6F3400'},
        900: {value: '#4F2100'}
    },

    green: {
        50: {value: '#EBF7E6'},
        100: {value: '#CDEFC4'},
        200: {value: '#91DB8B'},
        300: {value: '#45C65A'},
        400: {value: '#41B658'},
        500: {value: '#3BA755'},
        600: {value: '#2E844A'},
        700: {value: '#22683E'},
        800: {value: '#194E31'},
        900: {value: '#0E3522'}
    },

    teal: {
        50: {value: '#DEF9F3'},
        100: {value: '#ACF3E4'},
        200: {value: '#04E1CB'},
        300: {value: '#01C3B3'},
        400: {value: '#03B4A7'},
        500: {value: '#06A59A'},
        600: {value: '#0B827C'},
        700: {value: '#056764'},
        800: {value: '#024D4C'},
        900: {value: '#023434'}
    },

    blue: {
        50: {value: '#EEF4FF'},
        100: {value: '#D8E6FE'},
        200: {value: '#AACBFF'},
        300: {value: '#78B0FD'},
        400: {value: '#57A3FD'},
        500: {value: '#1B96FF'},
        600: {value: '#0176D3'},
        700: {value: '#0B5CAB'},
        800: {value: '#014486'},
        900: {value: '#032D60'}
    },

    cyan: {
        50: {value: '#EAF5FE'},
        100: {value: '#CFE9FE'},
        200: {value: '#90D0FE'},
        300: {value: '#1AB9FF'},
        400: {value: '#08ABED'},
        500: {value: '#0D9DDA'},
        600: {value: '#107CAD'},
        700: {value: '#05628A'},
        800: {value: '#084968'},
        900: {value: '#023248'}
    },

    purple: {
        50: {value: '#F6F2FB'},
        100: {value: '#ECE1F9'},
        200: {value: '#D78FF5'},
        300: {value: '#C29EF1'},
        400: {value: '#B78DEF'},
        500: {value: '#AD7BEE'},
        600: {value: '#9050E9'},
        700: {value: '#7526E3'},
        800: {value: '#5A1BA9'},
        900: {value: '#401075'}
    },

    pink: {
        50: {value: '#F9F0FF'},
        100: {value: '#F2DEFE'},
        200: {value: '#E5B9FE'},
        300: {value: '#D892FE'},
        400: {value: '#D17DFE'},
        500: {value: '#CB65FF'},
        600: {value: '#BA01FF'},
        700: {value: '#9602C7'},
        800: {value: '#730394'},
        900: {value: '#520066'}
    },

    cssColorGroups: {
        beige: {value: '#d3bca9'},
        black: {value: '#000000'},
        blue: {value: '#4089c0'},
        brown: {value: '#8e6950'},
        green: {value: '#88c290'},
        grey: {value: '#919191'},
        gray: {value: '#919191'},
        silver: {value: '#c0c0c0'},
        navy: {value: '#000080'},
        orange: {value: '#f4995c'},
        pink: {value: '#f5a0ca'},
        purple: {value: '#9873b9'},
        red: {value: '#df5b5b'},
        white: {value: '#FFFFFF'},
        yellow: {value: '#fbe85a'},
        gold: {value: '#ffd700'},
        miscellaneous: {
            value: 'linear-gradient(to right, orange , yellow, green, cyan, blue, violet)'
        }
    }
}

export default baseColors
