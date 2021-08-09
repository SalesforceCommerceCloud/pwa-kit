#!/usr/bin/env node
/* eslint import/no-commonjs:0 */

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')

/**
 * Optimize images in-place using imagemin.
 */
const main = () => {
    return imagemin(['./app/static/img/**/*.{jpg,png}'], {
        plugins: [imageminJpegtran(), imageminPngquant()]
    }).then((results) => {
        return Promise.all(
            results.map((result) =>
                fs.writeFileAsync(result.sourcePath, result.data, {encoding: 'binary'})
            )
        )
    })
}

main()
