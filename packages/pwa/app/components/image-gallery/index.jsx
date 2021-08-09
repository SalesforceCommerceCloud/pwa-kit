/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
    useStyleConfig,
    Skeleton as ChakraSkeleton,
    ListItem,
    List
} from '@chakra-ui/react'

const EnterKeyNumber = 13

const LARGE = 'large'
const SMALL = 'small'
const HeroImageMaxWidth = '680px'

/**
 * Filter out an image group from image groups based on size and selected variation attribute
 *
 * @param imageGroups - image groups to be filtered
 * @param options - contains size and selected variation attributes as filter criteria
 * @returns object
 */
const filterImageGroups = (imageGroups, options) => {
    const {size, selectedVariationAttributes = {}} = options
    const imageGroup = imageGroups
        .filter(({viewType}) => viewType === size)
        .find(({variationAttributes}) => {
            // if there is no variationAttributes in the imageGroups, no need to execute any further filter logic on it
            if (!variationAttributes && Object.keys(selectedVariationAttributes).length === 0) {
                return true
            }
            return (
                variationAttributes &&
                variationAttributes.every(({id, values}) => {
                    const valueValues = values.map(({value}) => value)
                    return valueValues.includes(selectedVariationAttributes[id])
                })
            )
        })
    return imageGroup
}

/**
 * The skeleton representation of the image gallery component. Use this component while
 * you are waiting for product data to be returnd from the server.
 */
export const Skeleton = () => (
    <Box data-testid="sf-image-gallery-skeleton">
        <Flex flexDirection="column">
            <AspectRatio ratio={1} marginBottom={2} maxWidth={HeroImageMaxWidth}>
                <ChakraSkeleton />
            </AspectRatio>
            <Flex>
                {new Array(4).fill(0).map((_, index) => (
                    <AspectRatio ratio={1} width={[20, 20, 24, 24]} marginRight={2} key={index}>
                        <ChakraSkeleton />
                    </AspectRatio>
                ))}
            </Flex>
        </Flex>
    </Box>
)

/**
 * The image gallery displays a hero image and thumbnails below it. You can control which
 * image groups that are use by passing in the currnet selected variation values.
 */
const ImageGallery = ({imageGroups = [], selectedVariationAttributes = {}}) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const styles = useStyleConfig('ImageGallery')
    const location = useLocation()

    // Get the 'hero' image for the current variation.
    const heroImageGroup = useMemo(
        () =>
            filterImageGroups(imageGroups, {
                size: LARGE,
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
            filterImageGroups(imageGroups, {
                size: SMALL,
                selectedVariationAttributes
            }),
        [selectedVariationAttributes]
    )

    const heroImage = heroImageGroup?.images?.[selectedIndex]
    const thumbnailImages = thumbnailImageGroup?.images || []

    return (
        <Flex direction="column">
            {heroImage && (
                <Box {...styles.heroImageGroup}>
                    <AspectRatio
                        {...styles.heroImage}
                        ratio={1}
                        maxWidth={['none', 'none', HeroImageMaxWidth]}
                    >
                        <Img alt={heroImage.alt} src={heroImage.disBaseLink} />
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
                                <Img alt={image.alt} src={image.disBaseLink} />
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
    selectedVariationAttributes: PropTypes.object
}

export default ImageGallery
