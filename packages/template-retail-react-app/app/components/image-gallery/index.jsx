/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useMemo, useEffect} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'

// Chakra Components
import {
    AspectRatio,
    Box,
    Img,
    Flex,

    // Hooks
    Skeleton as ChakraSkeleton,
    ListItem,
    List,
    useMultiStyleConfig
} from '@chakra-ui/react'
import {findImageGroupBy} from '../../utils/image-groups-utils'
import DynamicImage from '../dynamic-image'

const EnterKeyNumber = 13

const LARGE = 'large'
const SMALL = 'small'

/**
 * The skeleton representation of the image gallery component. Use this component while
 * you are waiting for product data to be returnd from the server.
 */
export const Skeleton = ({size}) => {
    const styles = useMultiStyleConfig('ImageGallery', {size})

    return (
        <Box data-testid="sf-image-gallery-skeleton">
            <Flex flexDirection="column">
                <AspectRatio ratio={1} {...styles.heroImageSkeleton}>
                    <ChakraSkeleton />
                </AspectRatio>
                <Flex>
                    {new Array(4).fill(0).map((_, index) => (
                        <AspectRatio ratio={1} {...styles.thumbnailImageSkeleton} key={index}>
                            <ChakraSkeleton />
                        </AspectRatio>
                    ))}
                </Flex>
            </Flex>
        </Box>
    )
}

Skeleton.propTypes = {
    size: PropTypes.bool
}

/**
 * The image gallery displays a hero image and thumbnails below it. You can control which
 * image groups that are use by passing in the current selected variation values.
 */
const ImageGallery = ({imageGroups = [], selectedVariationAttributes = {}, size}) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const styles = useMultiStyleConfig('ImageGallery', {size})
    const location = useLocation()

    // Get the 'hero' image for the current variation.
    const heroImageGroup = useMemo(
        () =>
            findImageGroupBy(imageGroups, {
                viewType: LARGE,
                selectedVariationAttributes
            }),
        [selectedVariationAttributes]
    )

    useEffect(() => {
        // reset the selected index when location search changes
        setSelectedIndex(0)
    }, [location.search])

    // Get a memoized image group used for the thumbnails. We use the `useMemo` hook
    // so we don't have to waste time filtering the image groups each render if the
    // selected variation attributes haven't changed.
    const thumbnailImageGroup = useMemo(
        () =>
            findImageGroupBy(imageGroups, {
                viewType: SMALL,
                selectedVariationAttributes
            }),
        [selectedVariationAttributes]
    )

    const heroImage = heroImageGroup?.images?.[selectedIndex]
    const thumbnailImages = thumbnailImageGroup?.images || []

    const heroImageMaxWidth = styles.heroImage.maxWidth[3] // in px

    return (
        <Flex direction="column">
            {heroImage && (
                <Box {...styles.heroImageGroup}>
                    <AspectRatio {...styles.heroImage} ratio={1}>
                        <DynamicImage
                            src={`${heroImage.disBaseLink || heroImage.link}[?sw={width}&q=60]`}
                            widths={{
                                base: '100vw',
                                lg: heroImageMaxWidth
                            }}
                            imageProps={{
                                alt: heroImage.alt
                            }}
                        />
                    </AspectRatio>
                </Box>
            )}

            <List display={'flex'} flexWrap={'wrap'}>
                {thumbnailImages.map((image, index) => {
                    const selected = index === selectedIndex
                    return (
                        <ListItem
                            {...styles.thumbnailImageItem}
                            tabIndex={0}
                            key={index}
                            data-testid="image-gallery-thumbnails"
                            onKeyDown={(e) => {
                                if (e.keyCode === EnterKeyNumber) {
                                    return setSelectedIndex(index)
                                }
                            }}
                            onClick={() => setSelectedIndex(index)}
                            borderColor={`${selected ? 'black' : ''}`}
                            borderWidth={`${selected ? '1px' : 0}`}
                        >
                            <AspectRatio ratio={1}>
                                <Img alt={image.alt} src={image.disBaseLink || image.link} />
                            </AspectRatio>
                        </ListItem>
                    )
                })}
            </List>
        </Flex>
    )
}

ImageGallery.propTypes = {
    /**
     * The images array to be rendered
     */
    imageGroups: PropTypes.array,
    /**
     * The current selected variation values
     */
    selectedVariationAttributes: PropTypes.object,
    /**
     * Size of the Image gallery, this will be used to determined the max width from styles
     */
    size: PropTypes.string
}

export default ImageGallery
