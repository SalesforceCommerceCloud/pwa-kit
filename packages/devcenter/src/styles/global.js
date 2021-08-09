import {css} from '@emotion/core'
import colors from '../gatsby-plugin-theme-ui/colors'
import theme from '../gatsby-plugin-theme-ui/'

const globalStyles = css`
    /**
   * Thanks to Benjamin De Cock
   * https://gist.github.com/bendc/ac03faac0bf2aee25b49e5fd260a727d
   */
    :root {
        --ease-in-quad: cubic-bezier(0.55, 0.085, 0.68, 0.53);
        --ease-in-quart: cubic-bezier(0.895, 0.03, 0.685, 0.22);
        --ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        --ease-out-quart: cubic-bezier(0.165, 0.84, 0.44, 1);
        --ease-in-out-quad: cubic-bezier(0.455, 0.03, 0.515, 0.955);
        --ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);
        --top-spacing: ${theme.headerHeightTopBanner};
        --top-spacing-right-sidebar: ${theme.headerHeightRightSidebarTopBanner};
        --top-spacing-scroll-padding-top: ${theme.space.exlg};
    }

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

    :root {
        box-sizing: border-box;
    }

    html {
        scroll-padding-top: var(--top-spacing-scroll-padding-top);
        height: 100%;
    }

    body {
        margin: 0;
        height: 100%;

        &.no-scroll {
            overflow: hidden;
        }
    }

    /* https://github.com/gatsbyjs/gatsby/issues/15486 */
    .gatsby-resp-image-image {
        width: 100%;
        height: 100%;
        margin: 0;
        vertical-align: middle;
        position: absolute;
        top: 0;
        left: 0;
    }

    figcaption {
        font-size: ${theme.fontSizes.sm};
        text-align: center;
        padding-bottom: ${theme.space.md};
    }

    /* Label styles for release notes */

    p.c-label {
        display: inline-block;
        padding: ${theme.space.xs} ${theme.space.sm};

        border-radius: ${theme.radii.sm};

        color: ${colors.white};
        font-family: inherit;
        font-weight: ${theme.fontWeights.bold};
        font-size: ${theme.fontSizes.md};
        letter-spacing: -0.18px;
        text-transform: uppercase;
        margin-bottom: 0;
    }

    .c-label.c--features {
        background: ${colors.alert};
    }

    .c-label.c--updates {
        background: ${colors.brightBlue};
    }

    .c-label.c--bugs {
        background: ${colors.purple};
    }

    .c-label.c--known {
        background: ${colors.mediumBlue};
    }

    /* Overrides for SDK component styles */

    .sdk-base img {
        height: auto;
    }

    // Component library styles
    // ---

    .component-intro {
        max-width: ${theme.maxContentWidth};
    }

    // Tab Component
    // ---

    .pw-tabs__link {
        background: transparent !important;
    }

    .pw-tabs.devcenter .pw-tabs__tab {
        width: auto;
        flex: none;
        font-weight: ${theme.fontWeights.medium};
        margin-right: ${theme.space.xl};
    }

    .pw-tabs.devcenter .pw-tabs__tab.pw--is-active {
        color: ${colors.brightBlue} !important;
        font-weight: ${theme.fontWeights.bold};
        box-shadow: none;
        position: relative;

        .pw-tabs__link {
            &::after {
                content: '""';
                color: transparent;
                position: absolute;
                bottom: 0;
                left: 0;
                background: ${colors.brightBlue};
                width: 100%;
            }
        }
    }

    .pw-tabs.devcenter .pw-tabs__strip {
        border-bottom: 1px solid ${colors.silver};
        margin-bottom: 0;
        z-index: 0;
    }

    .pw-tabs.devcenter.pw-tabs {
        border-bottom: 1px solid ${colors.silver};
        padding-top: ${theme.space.xl};
        padding-bottom: ${theme.space.sm};
    }

    .pw-tabs.devcenter .pw-tabs__link {
        color: inherit !important;
        outline: none;
        padding-left: ${theme.space.xs};
        padding-right: ${theme.space.xs};
        padding-bottom: ${theme.space.md};

        &::after {
            background: none;
            height: ${theme.borderWidths.medium};
        }

        &:focus {
            color: ${colors.brightBlue} !important;
        }

        &:active {
            background: transparent !important;
        }
    }

    .sdk-base [class*='rsg--preview'] .pw-toggle__inner.pw--overflow::after {
        background: linear-gradient(to top, rgb(243, 244, 248), rgba(255, 255, 255, 0));
    }

    .pw-sheet__content {
        padding-top: ${theme.space.xxxl};
    }

    [preclassname] {
        font-family: ${theme.fonts.monospace} !important;
        font-weight: ${theme.fontWeights.medium} !important;
        background-color: ${theme.colors.black} !important;
    }

    .u-visually-hidden {
        position: absolute;

        overflow: hidden;
        clip: rect(1px, 1px, 1px, 1px);
        width: 1px;
        height: 1px;
        padding: 0;
        border: 0;
    }
`

export default globalStyles
