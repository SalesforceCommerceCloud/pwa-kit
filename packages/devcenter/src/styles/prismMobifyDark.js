// @flow
// Converted automatically using ./tools/themeFromVsCode
// Based on https://github.com/FormidableLabs/prism-react-renderer/blob/master/src/themes/vsDark.js

var theme /*: PrismTheme */ = {
    plain: {
        color: "#F3F4F8",
        backgroundColor: "#000000"
    },
    styles: [
        {
            types: ["prolog"],
            style: {
                color: "#0045DF"
            }
        },
        {
            types: ["property"],
            style: {
                color: "#0288A7"
            }
        },
        {
            types: ["comment"],
            style: {
                color: "#4CB944"
            }
        },
        {
            types: ["builtin"],
            style: {
                color: "#0099FF"
            }
        },
        {
            types: ["changed", "keyword"],
            style: {
                color: "#A480FF"
            }
        },
        {
            types: ["number", "inserted"],
            style: {
                color: "#E6FFE1"
            }
        },
        {
            types: ["constant"],
            style: {
                color: "#A480FF"
            }
        },
        {
            types: ["attr-name", "variable"],
            style: {
                color: "#9CDCFE"
            }
        },
        {
            types: ["deleted", "string", "attr-value"],
            style: {
                color: "#FF852C"
            }
        },
        {
            types: ["selector"],
            style: {
                color: "#FFFAD1"
            }
        },
        {
            // Fix tag color
            types: ["tag"],
            style: {
                color: "#0099FF"
            }
        },
        {
            // Fix tag color for HTML
            types: ["tag"],
            languages: ["markup"],
            style: {
                color: "#0099FF"
            }
        },
        {
            types: ["punctuation", "operator"],
            style: {
                color: "#F3F4F8"
            }
        },
        {
            // Fix punctuation color for HTML
            types: ["punctuation"],
            languages: ["markup"],
            style: {
                color: "#F3F4F8"
            }
        },
        {
            types: ["function"],
            style: {
                color: "rgb(220, 220, 170)"
            }
        },
        {
            types: ["class-name"],
            style: {
                color: "rgb(78, 201, 176)"
            }
        },
        {
            types: ["parameter"],
            style: {
                color: "#9CDCFE"
            }
        },
        {
            types: ["char"],
            style: {
                color: "#DC0A3C"
            }
        }
    ]
};

module.exports = theme;
