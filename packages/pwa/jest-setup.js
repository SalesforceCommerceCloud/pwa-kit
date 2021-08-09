require('raf/polyfill') // fix requestAnimationFrame issue with polyfill
const Enzyme = require('enzyme')
const Adapter = require('enzyme-adapter-react-16')

Enzyme.configure({adapter: new Adapter()})
