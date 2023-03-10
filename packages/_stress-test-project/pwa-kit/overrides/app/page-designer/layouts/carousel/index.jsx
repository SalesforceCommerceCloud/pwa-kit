/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment, useCallback, useMemo, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {
    AspectRatio,
    Box,
    Heading,
    IconButton,
    Stack,
    useBreakpoint,
    useBreakpointValue
} from '@chakra-ui/react'
import {Component} from '../../core'
import {ChevronLeftIcon, ChevronRightIcon} from '../../../components/icons'
import {useEffect} from 'react'

/**
 * Display child components in a carousel slider manner. Configurations include the number of
 * children to display in view as well as whether or not to show controls and position indicators.
 *
 * @param {PageProps} props
 * @param {string} props.textHeading - Heading text for the carousel.
 * @param {boolean} props.xsCarouselIndicators - Show/Hide carousel indicators/pips on "xs" screens.
 * @param {boolean} props.smCarouselIndicators - Show/Hide carousel indicators/pips on "sm" screens.
 * @param {boolean} props.mdCarouselIndicators - Show/Hide carousel indicators/pips on "md" screens.
 * @param {boolean} props.xsCarouselControls - Show/Hide carousel forward/back controls on "xs" screens.
 * @param {boolean} props.smCarouselControls - Show/Hide carousel forward/back controls on "sm" screens.
 * @param {number} props.xsCarouselSlidesToDisplay - Number of children that will be rendered in view on "xs" screens.
 * @param {number} props.smCarouselSlidesToDisplay - Number of children that will be rendered in view on "sm" screens.
 * @param {number} props.mdCarouselSlidesToDisplay - Number of children that will be rendered in view on "md" screens.
 * @param {Object []} props.region - The regions passed internally to this component by the `commerce-sdk-react` Page component.
 * @returns {React.ReactElement} - Carousel component.
 */
export const Carousel = (props = {}) => {
    const scrollRef = useRef()
    const breakpoint = useBreakpoint()
    const [hasOverflow, setHasOverflow] = useState(false)

    const {
        textHeadline,
        xsCarouselIndicators = false,
        smCarouselIndicators = false,
        mdCarouselIndicators = false,
        xsCarouselControls = false,
        smCarouselControls = false,
        xsCarouselSlidesToDisplay = 1,
        smCarouselSlidesToDisplay = 1,
        mdCarouselSlidesToDisplay = 1,
        // Internally Provided
        regions
    } = props

    const controlDisplay = useMemo(() => {
        return {
            base: xsCarouselControls && hasOverflow ? 'block' : 'none',
            sm: xsCarouselControls && hasOverflow ? 'block' : 'none',
            md: smCarouselControls && hasOverflow ? 'block' : 'none',
            lg: hasOverflow ? 'block' : 'none'
        }
    }, [hasOverflow])

    const itemSpacing = 4
    // Calculate the width of each item in the carousel, accounting for the spacing between the items.
    const itemWidth = {
        base: `calc(${100 / xsCarouselSlidesToDisplay}% - ${
            ((xsCarouselSlidesToDisplay - 1) * (itemSpacing * 4)) / xsCarouselSlidesToDisplay
        }px)`,
        sm: `calc(${100 / xsCarouselSlidesToDisplay}% - ${
            ((xsCarouselSlidesToDisplay - 1) * (itemSpacing * 4)) / xsCarouselSlidesToDisplay
        }px)`,
        md: `calc(${100 / smCarouselSlidesToDisplay}% - ${
            ((smCarouselSlidesToDisplay - 1) * (itemSpacing * 4)) / smCarouselSlidesToDisplay
        }px)`,
        lg: `calc(${100 / mdCarouselSlidesToDisplay}% - ${
            ((mdCarouselSlidesToDisplay - 1) * (itemSpacing * 4)) / mdCarouselSlidesToDisplay
        }px)`
    }

    const overflowXScroll = {
        base: xsCarouselIndicators ? 'block' : 'none',
        sm: xsCarouselIndicators ? 'block' : 'none',
        md: smCarouselIndicators ? 'block' : 'none',
        lg: mdCarouselIndicators ? 'block' : 'none'
    }
    const overflowXScrollValue = useBreakpointValue(overflowXScroll)

    const components = regions[0]?.components || []
    const itemCount = components.length

    // Scroll the container left or right by 100%. Passing no args or `1`
    // scrolls to the right, and passing `-1` scrolls left.
    const scroll = useCallback((direction = 1) => {
        scrollRef.current?.scrollBy({
            top: 0,
            left: (direction * window.innerWidth) / itemCount,
            behavior: 'smooth'
        })
    })

    // Our indicator implementation uses the scrollbar to show the context of the current
    // item selected. Because MacOS hides scroll bars after they come to rest we need to
    // force them to show. Please note that this feature only works on web-kit browsers,
    // for all other browsers the scroller/indicator will be shown.
    const style = {
        '.scroll-indicator::-webkit-scrollbar': {
            display: overflowXScrollValue,
            ['-webkit-appearance']: `none`,
            height: `8px`
        },
        '.scroll-indicator::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
    }

    useEffect(() => {
        const {clientWidth, scrollWidth} = scrollRef.current
        setHasOverflow(scrollWidth > clientWidth)
    }, [breakpoint, props])

    return (
        <Box className={'carousel'} sx={style} position="relative" data-testid="carousel">
            <Stack className={'carousel-container'} data-testid="carousel-container" spacing={6}>
                {textHeadline && (
                    <Heading as="h2" fontSize="xl" textAlign="center">
                        {textHeadline}
                    </Heading>
                )}

                <Stack
                    ref={scrollRef}
                    className={'carousel-container-items scroll-indicator'}
                    data-testid="carousel-container-items"
                    direction="row"
                    spacing={itemSpacing}
                    wrap="nowrap"
                    overflowX="scroll"
                    sx={{
                        scrollPadding: 0,
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {components.map((component, index) => (
                        <Box
                            key={component?.id || index}
                            flex="0 0 auto"
                            width={itemWidth}
                            style={{scrollSnapAlign: 'start'}}
                        >
                            <AspectRatio ratio={0.75}>
                                <Component component={component} />
                            </AspectRatio>
                        </Box>
                    ))}
                </Stack>
            </Stack>

            {/* Button Controls */}
            <Fragment>
                <Box
                    display={controlDisplay}
                    position="absolute"
                    top="50%"
                    left={{base: 1, lg: 4}}
                    transform="translateY(-50%)"
                >
                    {/* boxShadow requires !important --> https://github.com/chakra-ui/chakra-ui/issues/3553 */}
                    <IconButton
                        data-testid="carousel-nav-left"
                        aria-label="Scroll carousel left"
                        icon={<ChevronLeftIcon color="black" />}
                        borderRadius="full"
                        colorScheme="whiteAlpha"
                        boxShadow={'0 3px 10px rgb(0 0 0 / 20%) !important'}
                        onClick={() => scroll(-1)}
                    />
                </Box>

                <Box
                    display={controlDisplay}
                    position="absolute"
                    top="50%"
                    right={{base: 1, lg: 4}}
                    transform="translateY(-50%)"
                >
                    {/* boxShadow requires !important --> https://github.com/chakra-ui/chakra-ui/issues/3553 */}
                    <IconButton
                        data-testid="carousel-nav-right"
                        aria-label="Scroll carousel right"
                        icon={<ChevronRightIcon color="black" />}
                        borderRadius="full"
                        colorScheme="whiteAlpha"
                        boxShadow={'0 3px 10px rgb(0 0 0 / 20%) !important'}
                        onClick={() => scroll(1)}
                    />
                </Box>
            </Fragment>
        </Box>
    )
}

Carousel.propTypes = {
    regions: PropTypes.array.isRequired,
    textHeadline: PropTypes.string,
    xsCarouselIndicators: PropTypes.bool,
    smCarouselIndicators: PropTypes.bool,
    mdCarouselIndicators: PropTypes.bool,
    xsCarouselControls: PropTypes.bool,
    smCarouselControls: PropTypes.bool,
    xsCarouselSlidesToDisplay: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
    smCarouselSlidesToDisplay: PropTypes.oneOf([1, 2, 3, 4, 5, 6]),
    mdCarouselSlidesToDisplay: PropTypes.oneOf([1, 2, 3, 4, 5, 6])
}

Carousel.displayName = 'Carousel'

export default Carousel
