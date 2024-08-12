const fs = require('fs')
const {extractStyle} = require('@ant-design/static-style-extract')

const outputPath = './assets/antd.min.css'

// NOTE: There is an open issue with AntD where the built styls are all named spaced for development
// only use. I have manually removed the prefix so it works with production deploys. We should maybe
// look to build maybe dev and production.
const css = extractStyle()

fs.writeFileSync(outputPath, css)