/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    AspectRatio,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'

const Image = ({image, dynamicImageProps}) => {
    const styles = useMultiStyleConfig('ProductTile')
    return (
        <AspectRatio {...styles.image}>
            <DynamicImage
                src={`${image.disBaseLink || image.link}[?sw={width}&q=60]`}
                widths={dynamicImageProps?.widths}
                imageProps={{
                    alt: image.alt,
                    ...dynamicImageProps?.imageProps
                }}
            />
        </AspectRatio>
    )
}
Image.propTypes = {
    image: PropTypes.shape({
        alt: PropTypes.string,
        disBaseLink: PropTypes.string,
        link: PropTypes.string
    }),
    dynamicImageProps: PropTypes.object
}

export default Image
