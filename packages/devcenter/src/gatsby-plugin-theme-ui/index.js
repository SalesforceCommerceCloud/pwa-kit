// These project-wide theme values are available to any component using
// Emotion's styled feature or any component using the sx prop from theme-ui.
// Most values were inherited from Mobify's older Sass-based systems.

// Variables
// ---

// These variables are used to formulate some values in the theme object, but
// they are not included in the theme object itself.

// Our base unit and ratio for spacing and alignment for the entire project.
// They are responsible for laying out the majority of the design system.
import {breakPointsMap} from '../hooks/useMedia'

const unit = 8 // in pixels

// UI element sizes
const minPageWidth = '320px'
const maxPageWidth = '1440px'
const oneColumnContentWidth = '1440px'
const twoColumnContentWidth = '1040px'
const threeColumnContentWidth = '680px'
const sidebarWidth = '256px'
const sidebarWidthDesktop = '280px'

const headerHeight = '119px'

const headerHeightTopBanner = '136px'
const headerHeightRightSidebar = '112px'
const headerHeightRightSidebarTopBanner = '164px'

const headerMaxHeight = '64px'
const headerMinHeight = '55px'
const logoHeight = '20px'

const inputHeight = '40px'

const footerHeight = '120px'
const footerPadding = ' 160px' // only value for padding, no need to create space alias

const navbarWidgetHeight = '37px'
const navbarBottomOffset = '42px'

const maxContentWidth = '680px'
const calloutIconSize = '20px'

// Colors are defined in their own file
import colors from './colors'

// Headings
const headingBase = {
    fontFamily: 'heading',
    lineHeight: 'heading',
    fontWeight: 'heading',
    paddingBottom: 0,
    scrollMarginTop: headerMaxHeight,
    fontDisplay: 'swap'
}

const headings = {
    h1: {
        ...headingBase,
        fontSize: ['xxl', 'xxxl'], // 32px 40px
        mb: 'lg' // 20px
    },

    h2: {
        ...headingBase,
        fontSize: ['lg', 'xxl'], // 20px 32px
        pt: 'xxl', // 32px
        mb: 'xl' // 24px
    },
    h3: {
        ...headingBase,
        fontSize: ['lg', 'xl'], // 20px 24px
        pt: 'xl', // 24px
        mb: 'md' // 16px
    },
    h4: {
        ...headingBase,
        fontSize: ['md', 'lg'], // 16px 20px
        pt: 'md', // 16px
        mb: 'sm' //  8px
    },
    h5: {
        ...headingBase,
        fontSize: ['sm', 'md'], // 14px 16px
        pt: 'md', // 16px
        mb: 'sm' //  8px
    },
    h6: {
        ...headingBase,
        fontSize: [0, 'sm'], // 12px 14px
        pt: 'md', // 16px
        mb: 'sm' //  8px
    }
}

// Transition for CSS animations
const transition = '0.15s'

// All the system fonts for different platforms
const systemFonts =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'

// The main theme object
const theme = {
    // Border widths
    borderWidths: [1, 2, 4, 8],
    // 769px 961px 1281px
    breakpoints: [
        `${breakPointsMap.tablet + 1}px`,
        `${breakPointsMap.desktop + 1}px`,
        `${breakPointsMap.desktop_medium + 1}px`
    ],

    // Colors (imported above)
    colors,

    // Font families
    fonts: {
        body: systemFonts, // imported above
        heading: '"Gotham SSm A", -apple-system, sans-serif',
        monospace:
            'Consolas, "SF Mono", "Roboto Mono", Menlo, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
    },

    // Font size scale
    //           0   1   2   3   4   5   6   7   8   9
    fontSizes: [12, 14, 16, 20, 24, 32, 40, 48, 64, 72], // Usage: fontSize: [0, 1, 2]

    // Font weight scale
    fontWeights: {
        thin: 300,
        light: 400,
        medium: 500,
        bold: 700,
        bolder: 800,
        heavy: 900
    },

    // Use CSS custom properties for Theme-UI color modes
    useCustomProperties: true,

    // Initial setting for switchable color modes
    initialColorMode: 'default',

    // Line height (AKA "leading") scale
    lineHeights: {
        body: 1.51,
        heading: 1.16,
        link: 1.25
    },

    // Letter spacings
    letterSpacings: {
        body: 'normal',
        caps: '0.2em'
    },

    // Minimum and maximum page widths
    minPageWidth,
    maxPageWidth,
    oneColumnContentWidth,
    twoColumnContentWidth,
    threeColumnContentWidth,
    maxContentWidth,
    // UI element sizes
    sidebarWidth,
    sidebarWidthDesktop,

    headerHeight,
    headerHeightTopBanner,
    headerMaxHeight,
    headerMinHeight,
    headerHeightRightSidebar,
    headerHeightRightSidebarTopBanner,

    logoHeight,
    navbarWidgetHeight,
    footerHeight,
    footerPadding,
    navbarBottomOffset,
    calloutIconSize,

    inputHeight,

    // Radii for borderRadius
    radii: {
        body: `${unit * 4}px`, // 32px
        sm: `${unit / 2}px`, //  4px
        md: `10px`
    },

    // Search box height (should be big enough to be tappable)
    searchInputHeight: unit * 5, // 40

    // Shadows for boxShadow
    shadows: {
        lighter: '0 0 1px 0 rgba(0,0,0,0.32), 0 1px 1px 0 rgba(0,0,0,0.12)',
        light: '0 0 1px 0 rgba(0,0,0,0.32), 0 3px 4px 0 rgba(0,0,0,0.12)',
        medium: '0 0 1px 0 rgba(0,0,0,0.32), 0 8px 10px 0 rgba(0,0,0,0.12)',
        dark: '0 1px 8px 0 rgba(0,0,0,0.4)',

        primaryButton: '0 2px 4px 0 rgba(0,69,223,0.3)',
        cardActive: `inset 4px 0 0 0 ${colors.brightBlue}`
    },

    // Space scale used for margin and padding
    //      0  1  2   3   4   5   6   7   8   9  10  11   12  13
    space: [0, 4, 8, 12, 16, 20, 24, 32, 44, 48, 64, 72, 128, 256],

    // Size of tap target on touch devices
    tapSize: unit * 4.75, // 38

    // Transition duration and easing for CSS animations
    transition,

    // Z-index layers
    // ---
    // Organizes z-index usage by name. Values can be incremented/decremented
    // slightly as necessary. eg. stageLayer + 1. Whenever possible though, use
    // one of these values.
    zIndices: {
        z1Depth: 1, // background
        z2Depth: 10, // icon or other UI element
        z3Depth: 100, // modal shade or similar
        z4Depth: 1000 // modal dialog or similar
    },

    // Styles for MDX components
    styles: {
        root: {
            fontFamily: 'body',
            lineHeight: 'body',
            fontWeight: 'body',
            '.sdk-base h1': {
                ':first-of-type': {
                    mt: 0,
                    position: 'static',
                    borderTop: 0
                },
                borderTop: 0,
                marginTop: 0
            },
            ...headings
        },
        ...headings,
        p: {
            my: 'md',
            fontSize: 'md' // 16px
        },
        a: {
            color: 'brightBlue',
            transition: `color ${transition}`,
            textDecoration: 'underline',
            ':active,:focus': {
                color: 'brightBlue',
                textDecoration: 'underline !important',
                backgroundColor: 'mediumSilver',
                outline: 'none'
            },
            ':hover': {
                textDecoration: 'none'
            }
        },
        pre: {
            color: '#F3F4F8',
            fontFamily: 'monospace',
            fontSize: 'md', // 16px
            tabSize: 4,
            hyphens: 'none',
            overflow: 'auto',
            borderRadius: 'sm',
            my: 'lg'
        },
        inlineCode: {
            color: 'black',
            backgroundColor: 'lightSilver',
            fontFamily: 'monospace',
            fontSize: 'sm',
            fontWeight: 'medium',
            borderRadius: 'sm',
            px: 'xs',
            py: 'xxs'
        },
        table: {
            overflowX: 'auto',
            my: 'lg',
            borderCollapse: 'separate',
            borderSpacing: 0,
            borderStyle: 'solid',
            borderWidth: 'thinnest',
            borderColor: 'mediumSilver',
            borderRadius: '4px 4px 0px 0px',
            thead: {
                backgroundColor: 'lightSilver',
                textTransform: 'uppercase',
                fontWeight: 'heading',
                fontFamily: 'heading',
                fontSize: 'md'
            },
            th: {
                textAlign: 'left',
                py: 'mid',
                px: 'lg',
                color: 'gray',
                borderColor: 'gray',
                borderBottomStyle: 'solid',
                verticalAlign: 'bottom',
                borderBottomWidth: 'thinnest',
                fontSize: 'sm'
            },
            td: {
                textAlign: 'left',
                py: 'mid',
                px: 'lg',
                borderColor: 'muted',
                borderBottomStyle: 'solid',
                borderBottomWidth: 'thinnest',
                borderRightStyle: 'solid',
                borderRightWidth: 'thinnest',
                verticalAlign: 'top'
            },
            '.docblock > p': {
                margin: 0,
                padding: 0
            },
            code: function() {
                // Do not replace above with an arrow function, please. It will break!
                return theme.styles.inlineCode
            }
        }
    },
    layout: {
        homepage_container: {
            paddingBottom: 'exlg',
            marginBottom: 'exlg',
            px: ['xl', 'xl', 'exlg'],
            h1: {
                fontSize: ['xxxl', 'exlg', 'exlg']
            },
            h2: {
                fontSize: ['xxl', 'xxxl', 'xxxl'],
                paddingTop: 0
            },
            h3: {
                fontSize: ['xl', 'xl', 'xxl']
            },
            h4: {
                fontSize: 'lg',
                color: 'brightBlue'
            },
            'h1:first-of-type::after': {
                paddingTop: 0,
                marginTop: 0,
                backgroundColor: 'transparent'
            }
        }
    },
    text: {
        homepage_header: {
            marginBottom: '0px !important' // can't override the root h2
        },
        homepage_heading_description: {
            mt: 'mid',
            mb: 'xxl'
        }
    }
}

// Border widths
theme.borderWidths.thinnest = `${theme.borderWidths[0]}px` // 1px
theme.borderWidths.thin = `${theme.borderWidths[1]}px` // 2px
theme.borderWidths.medium = `${theme.borderWidths[2]}px` // 4px
theme.borderWidths.thick = `${theme.borderWidths[3]}px` // 8px

// TODO: standardize later, only need a few for sidebar at the moment
theme.fontSizes.xs = `${theme.fontSizes[0]}px` // 12px
theme.fontSizes.sm = `${theme.fontSizes[1]}px` // 14px
theme.fontSizes.md = `${theme.fontSizes[2]}px` // 16px
theme.fontSizes.lg = `${theme.fontSizes[3]}px` // 20px
theme.fontSizes.xl = `${theme.fontSizes[4]}px` // 24px
theme.fontSizes.xxl = `${theme.fontSizes[5]}px` // 32px
theme.fontSizes.xxxl = `${theme.fontSizes[6]}px` // 40px
theme.fontSizes.exlg = `${theme.fontSizes[7]}px` // 48px

// Spaces
theme.space.zero = `${theme.space[0]}px` // Zero                0px
theme.space.xxs = `${theme.space[1] / 2}px` // Extra-extra-small   2px
theme.space.xs = `${theme.space[1]}px` // Extra-small         4px
theme.space.sm = `${theme.space[2]}px` // Small               8px
theme.space.mid = `${theme.space[3]}px` // Mid-range       12px
theme.space.md = `${theme.space[4]}px` // Medium             16px
theme.space.lg = `${theme.space[5]}px` // Large              20px
theme.space.xl = `${theme.space[6]}px` // Extra-large        24px
theme.space.xxl = `${theme.space[7]}px` // Extra-extra-large  32px
theme.space.largish = `${theme.space[8]}px` // Largish           44px
theme.space.xxxl = `${theme.space[9]}px` // XXX-large          48px
theme.space.exlg = `${theme.space[10]}px` // Extreme-large      64px

export default theme
