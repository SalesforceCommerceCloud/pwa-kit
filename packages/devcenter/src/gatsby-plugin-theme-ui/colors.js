// Neutrals
const black = '#000000'
const black20 = 'rgba(0, 0, 0, 0.2)'
const gray = '#42526e'
const mediumGray = '#6b778c'
const lightGray = '#abb1bb'
const silver = '#c7cad1'
const mediumSilver = '#e7e8eb'
const lightSilver = '#f3f4f8'
const muted = '#f6f6f6'
const white = '#ffffff'
const white20 = 'rgba(255, 255, 255, 0.2)'
const chrome = lightSilver
const chromeShadow = 'rgba(10,31,68,0.08)'
const lightTransparent = 'rgba(255, 255, 255, 0.50)'
const darkTransparent = 'rgba(0, 0, 0, 0.35)'

// Common
const red = '#dc0a3c'
const mediumRed = '#e7204f'
const lightRed = '#fceff0'

const orange = '#c74a00'
const mediumOrange = '#ff852c'
const lightOrange = '#fdefe5'

const blue = '#005c83'
const mediumBlue = '#0288a7'
const lightBlue = '#e4f0f2'
const darkBlue = '#002a97'
const darkerBlue = '#012a3b'

const purple = '#4e439b'
const mediumPurple = '#7f68b9'
const lightPurple = '#f5f0f9'

const brightBlue = '#0045df'
const mediumBrightBlue = '#0099ff'
const lightBrightBlue = '#e7f2fc'

const green = '#056c08'
const mediumGreen = '#4cb944'
const lightGreen = '#ecf6ea'

const yellow = '#9f5200'
const mediumYellow = '#ffb915'
const lightYellow = '#fdf5d9'

export default {
    text: black,
    background: white,
    primary: mediumBlue,
    secondary: brightBlue,
    accent: blue,
    alert: mediumRed,
    muted: muted,
    chrome: chrome,
    chromeShadow: chromeShadow,
    headerBackground: blue,
    headerText: white,
    sidebar: lightSilver,
    borderColor: silver,
    gray: gray,
    lightTransparent: lightTransparent,
    darkTransparent: darkTransparent,
    brightBlue: brightBlue,
    modes: {
        dark: {
            text: white,
            background: darkerBlue,
            headerBackground: darkerBlue,
            borderColor: white20,
            chrome: chrome,
            chromeShadow: chromeShadow
        },
        light: {
            text: black,
            background: white,
            headerBackground: blue,
            borderColor: silver,
            chrome: chrome,
            chromeShadow: chromeShadow
        }
    },
    black: black,
    black20: black20,
    mediumGray: mediumGray,
    lightGray: lightGray,
    silver: silver,
    mediumSilver: mediumSilver,
    lightSilver: lightSilver,
    white: white,
    white20: white20,
    red: red,
    mediumRed: mediumRed,
    lightRed: lightRed,
    orange: orange,
    mediumOrange: mediumOrange,
    lightOrange: lightOrange,
    blue: blue,
    mediumBlue: mediumBlue,
    lightBlue: lightBlue,
    darkBlue: darkBlue,
    darkerBlue,
    purple: purple,
    mediumPurple: mediumPurple,
    lightPurple: lightPurple,
    mediumBrightBlue: mediumBrightBlue,
    lightBrightBlue: lightBrightBlue,
    green: green,
    mediumGreen: mediumGreen,
    lightGreen: lightGreen,
    yellow: yellow,
    mediumYellow: mediumYellow,
    lightYellow: lightYellow
}
