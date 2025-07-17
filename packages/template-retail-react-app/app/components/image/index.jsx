/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'
import {Img} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    getImageAttributes,
    getImageLinkAttributes
} from '@salesforce/retail-react-app/app/utils/image'
import {isServer} from '@salesforce/retail-react-app/app/components/image/utils'

/**
 * Image component, with the help of which certain performance best practices can be
 * implemented in a simple convenient way. The component ensures the following:
 * * eagerly-loaded images are attributed with `fetchpriority="high"` and in addition receive a `<link rel="preload"/>` element in the document header during server-side rendering
 * * lazily-loaded images are attributed with `decoding="async"` to take as much load as possible from the main thread
 * * eventually already existing `fetchpriority` or `decoding` attributes have/keep priority
 * @see {@link https://help.salesforce.com/s/articleView?id=cc.b2c_image_transformation_service.htm&type=5}
 */
const Image = (props) => {
    const {as, ...rest} = props
    const Component = as ? as : Img
    const [effectiveImageProps, effectiveLinkProps] = useMemo(() => {
        const imageProps = getImageAttributes(rest)
        const linkProps = getImageLinkAttributes(imageProps)
        return [imageProps, linkProps]
    }, [rest])

    return (
        <>
            <Component {...effectiveImageProps} />
            {effectiveLinkProps && isServer() && (
                <Helmet>
                    <link {...effectiveLinkProps} />
                </Helmet>
            )}
        </>
    )
}

Image.propTypes = {
    /**
     * Override with your chosen image component
     */
    as: PropTypes.elementType,
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
    loading: PropTypes.oneOf(['eager', 'lazy']),
    fetchPriority: PropTypes.oneOf(['high', 'low', 'auto']),
    decoding: PropTypes.oneOf(['sync', 'async', 'auto'])
}

export default Image
