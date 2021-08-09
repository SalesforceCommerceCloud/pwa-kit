// Configuration for the postcss loader used within webpack within styleguidist :|
const autoprefixer = require('autoprefixer')

module.exports = {
    plugins: [
        autoprefixer({
            browsers: ['iOS >= 6.0', 'Android >= 2.3', 'last 4 ChromeAndroid versions']
        })
    ]
}
