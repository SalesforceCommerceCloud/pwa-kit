/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Image as ChakraImage, Img as ChakraImg} from '@chakra-ui/react'

export const Image = ({src, vwSizes, sizes, srcSet, ...otherProps}) => {
    return <ChakraImage {...getImageProps({src, vwSizes, sizes, srcSet, ...otherProps})} />

    // TODO:
    // - strip out src optional parameters
    // - map vwSizes into {sizes as string[], srcSet as number[]}
    // - convert sizes into string literal version
    // - convert srcSet into string literal version <- use src optional param
}
Image.propTypes = {}

export const Img = ({src, vwSizes, sizes, srcSet, ...otherProps}) => {
    return <ChakraImg {...getImageProps({src, vwSizes, sizes, srcSet, ...otherProps})} />
}
Img.propTypes = {}

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {number[]} props.vwSizes
 * @param {(string[]|object|string)} props.sizes
 * @param {(number[]|string)} props.srcSet
 * @return {Object} props for Chakra image component
 */
const getImageProps = ({src, vwSizes, sizes: _sizes, srcSet: _srcSet, ...otherProps}) => {
    const imageProps = {src: getSrcWithoutOptionalParams(src)}

    if (vwSizes) {
        const {sizes, srcSet} = mapVwSizesToSizesAndSrcSet(vwSizes)
        imageProps.sizes = convertSizesToHTMLAttribute(sizes)
        imageProps.srcSet = convertSrcSetToHTMLAttribute(srcSet, src)

        if (vwSizes && _sizes && _srcSet) {
            console.error('Cannot pass in sizes and srcSet when you already have specified vwSizes')
        }
    }

    if (_sizes) {
        imageProps.sizes = convertSizesToHTMLAttribute(_sizes)
    }
    if (_srcSet) {
        imageProps.srcSet = convertSrcSetToHTMLAttribute(_srcSet, src)
    }

    return {
        ...imageProps,
        ...otherProps
    }
}

/**
 * @param {(string[]|object|string)} sizes
 */
const convertSizesToHTMLAttribute = (sizes) => {
    return ''
}

/**
 * @param {(number[]|string)} srcSet
 * @param {string} srcFormat
 */
const convertSrcSetToHTMLAttribute = (srcSet, srcFormat) => {
    return ''
}

/**
 * @param {number[]} vwSizes
 */
const mapVwSizesToSizesAndSrcSet = (vwSizes) => {
    return {
        sizes: [],
        srcSet: []
    }
}

/**
 * @param {string} srcFormat
 */
const getSrcWithoutOptionalParams = (srcFormat) => {
    return ''
}
