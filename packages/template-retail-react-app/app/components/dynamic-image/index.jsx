/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'
import {Box, useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Img} from '@salesforce/retail-react-app/app/components/shared/ui'
import {getResponsivePictureAttributes} from '@salesforce/retail-react-app/app/utils/responsive-image'
import {
    getImageAttributes,
    getImageLinkAttributes
} from '@salesforce/retail-react-app/app/utils/image'
import {isServer} from '@salesforce/retail-react-app/app/components/image/utils'

/**
 * Responsive image component optimized to work with the Dynamic Imaging Service.
 * Via this component it's easy to create a `<picture>` element with related
 * theme-aware `<source>` elements and responsive preloading for high-priority
 * images.
 * @example Widths without a unit defined as array (interpreted as px values)
 * <DynamicImage
 *   src="http://example.com/image.jpg[?sw={width}&q=60]"
 *   widths={[100, 360, 720]} />
 * @example Widths without a unit defined as object (interpreted as px values)
 * <DynamicImage
 *   src="http://example.com/image.jpg[?sw={width}&q=60]"
 *   widths={{base: 100, sm: 360, md: 720}} />
 * @example Widths with mixed px and vw units defined as array
 * <DynamicImage
 *   src="http://example.com/image.jpg[?sw={width}&q=60]"
 *   widths={['50vw', '100vw', '500px']} />
 * @example Eagerly load image with high priority and responsive preloading
 * <DynamicImage
 *   src="http://example.com/image.jpg[?sw={width}&q=60]"
 *   widths={['50vw', '50vw', '20vw', '20vw', '25vw']}
 *   imageProps={{loading: 'eager'}}
 *   />
 * @see {@link https://web.dev/learn/design/responsive-images}
 * @see {@link https://web.dev/learn/design/picture-element}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images}
 * @see {@link https://help.salesforce.com/s/articleView?id=cc.b2c_image_transformation_service.htm&type=5}
 */
const DynamicImage = ({src, widths, imageProps, as, ...rest}) => {
    const Component = as ? as : Img
    const theme = useTheme()

    const [responsiveImageProps, numSources, effectiveImageProps, responsiveLinks] = useMemo(() => {
        const responsiveImageProps = getResponsivePictureAttributes({
            src,
            widths,
            breakpoints: theme.breakpoints
        })
        const effectiveImageProps = getImageAttributes(imageProps)
        const fetchPriority = effectiveImageProps.fetchPriority
        const responsiveLinks =
            !responsiveImageProps.links.length && fetchPriority === 'high'
                ? [
                      getImageLinkAttributes({
                          ...effectiveImageProps,
                          fetchPriority, // React <18 vs. >=19 issue
                          src: responsiveImageProps.src
                      })
                  ]
                : responsiveImageProps.links.reduce((acc, link) => {
                      const linkProps = getImageLinkAttributes({
                          ...effectiveImageProps,
                          ...link,
                          fetchPriority, // React <18 vs. >=19 issue
                          src: responsiveImageProps.src
                      })
                      if (linkProps) {
                          acc.push(linkProps)
                      }
                      return acc
                  }, [])
        return [
            responsiveImageProps,
            responsiveImageProps.sources.length,
            effectiveImageProps,
            responsiveLinks
        ]
    }, [src, widths, theme.breakpoints])

    return (
        <Box {...rest}>
            {numSources > 0 ? (
                <picture>
                    {responsiveImageProps.sources.map(({srcSet, sizes, media}, idx) => (
                        <source key={idx} media={media} sizes={sizes} srcSet={srcSet} />
                    ))}
                    <Component {...effectiveImageProps} src={responsiveImageProps.src} />
                </picture>
            ) : (
                <Component {...effectiveImageProps} src={responsiveImageProps.src} />
            )}

            {isServer() && responsiveLinks.length > 0 && (
                <Helmet>
                    {responsiveLinks.map((responsiveLinkProps, idx) => {
                        const {href, ...rest} = responsiveLinkProps
                        return <link key={idx} {...rest} href={href} />
                    })}
                </Helmet>
            )}
        </Box>
    )
}

DynamicImage.propTypes = {
    /**
     * Dynamic src having an optional param that can vary with widths. For example: `image[_{width}].jpg` or `image.jpg[?sw={width}&q=60]`
     */
    src: PropTypes.string,
    /**
     * Image widths relative to the breakpoints, whose units can either be px or vw or unit-less. They will be mapped to the corresponding `sizes` and `srcSet`.
     */
    widths: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    /**
     * Props to pass to the inner image component
     */
    imageProps: PropTypes.object,
    /**
     * Override with your chosen image component
     */
    as: PropTypes.elementType
}

export default DynamicImage
