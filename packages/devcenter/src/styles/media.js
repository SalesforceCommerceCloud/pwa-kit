import {css} from '@emotion/core'

export const breakpoints = [
    ['phone_small', 320],
    ['phone', 376],
    ['phablet', 540],
    ['tablet', 768], // In theme
    ['desktop', 960], // In theme
    ['desktop_medium', 1280], // In theme
    ['desktop_large', 1440]
]

/**
 * This file was inspired by https://github.com/narative/gatsby-theme-novela
 */

const toEm = (size) => `${size / 16}em`

/**
 * All breakpoints can be found inside of theme.breakpoints.
 * Each is turned in to a min + 1 and max-width version.
 *
 * There are also break points to cover coarse and fine pointer devices
 *
 * @example
 *
 *    ${mediaqueries.phone` width: 100px; `};
 *    ${mediaqueries.tablet_up` width: 200px; `};
 */

const mediaqueries = breakpoints.reduce(
    (acc, [label, size], i) => ({
        ...acc,
        // max-width media query e.g. mediaqueries.desktop
        [label]: (...args) => css`
            @media (max-width: ${toEm(size)}) {
                ${css(...args)};
            }
        `,
        // min-width media query e.g. mediaqueries.desktop_up
        // This is the breakpoint prior's size +1
        [`${label}_up`]: (...args) => css`
            @media (min-width: ${toEm(breakpoints[i - 1][1] + 1)}) {
                ${css(...args)};
            }
        `
    }),
    {}
)

export default mediaqueries
