/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment, useCallback, useRef} from 'react'
import PropTypes from 'prop-types'
import {AspectRatio, Box, Heading, IconButton, Stack, useBreakpointValue} from '@chakra-ui/react'
import {Component} from 'commerce-sdk-react-preview/components'
import {ChevronLeftIcon, ChevronRightIcon} from '../../icons'

/**
 * Display child components in a carousel slider manner. Configurations include the number of
 * children to display in view as well as whether or not to show controls and position indicators.
 *
 * @param {PageProps} props
 * @param {string} props.textHeadling - Heading text for the carousel.
 * @param {boolean} props.xsCarouselIndicators - Show/Hide carousel indecators/pips on "xs" screens.
 * @param {boolean} props.smCarouselIndicators - Show/Hide carousel indecators/pips on "sm" screens.
 * @param {boolean} props.mdCarouselIndicators - Show/Hide carousel indecators/pips on "md" screens.
 * @param {boolean} props.xsCarouselControls - Show/Hide carousel forward/back controls on "xs" screens.
 * @param {boolean} props.smCarouselControls - Show/Hide carousel forward/back controls on "sm" screens.
 * @param {number} props.xsCarouselSlidesToDisplay - Number of children that will be rendered in view on "xs" screens.
 * @param {number} props.smCarouselSlidesToDisplay - Number of children that will be rendered in view on "sm" screens.
 * @param {number} props.mdCarouselSlidesToDisplay - Number of children that will be rendered in view on "md" screens.
 * @param {Object []} props.region - The regions passed internally to this component by the `commerce-sdk-react` Page component.
 * @returns {React.ReactElement} - Crousel component.
 */
const Carousel = (props = {}) => {
    const scrollRef = useRef()

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

    const controlDisplay = {
        base: xsCarouselControls ? 'block' : 'none',
        sm: xsCarouselControls ? 'block' : 'none',
        md: smCarouselControls ? 'block' : 'none',
        lg: 'block'
    }

    const itemWidth = {
        base: `calc(${100 / xsCarouselSlidesToDisplay}%)`,
        sm: `calc(${100 / xsCarouselSlidesToDisplay}%)`,
        md: `calc(${100 / smCarouselSlidesToDisplay}%)`,
        lg: `calc(${100 / mdCarouselSlidesToDisplay}%)`
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
    // for all other brosers the scroller/indicator will be shown.
    const css = `
        .indicator-scroller::-webkit-scrollbar {
            display:${overflowXScrollValue};
            -webkit-appearance: none;
            height: 8px;
        }
        .indicator-scroller::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.5);
        }
    `

    return (
        <Box className={'carousel'} position="relative" data-testid="experience-carousel">
            <style>{css}</style>
            <Stack spacing={6}>
                {textHeadline && (
                    <Heading as="h2" fontSize="xl" textAlign="center">
                        {textHeadline}
                    </Heading>
                )}

                <Stack
                    ref={scrollRef}
                    className="indicator-scroller"
                    direction="row"
                    spacing={0}
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
                            <AspectRatio ratio={1}>
                                <Component component={{...component, index}} />
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
                    left={{base: 0, lg: 4}}
                    transform="translateY(-50%)"
                >
                    <IconButton
                        data-testid="product-scroller-nav-left"
                        aria-label="Scroll products left"
                        icon={<ChevronLeftIcon color="black" />}
                        borderRadius="full"
                        colorScheme="whiteAlpha"
                        onClick={() => scroll(-1)}
                    />
                </Box>

                <Box
                    display={controlDisplay}
                    position="absolute"
                    top="50%"
                    right={{base: 0, lg: 4}}
                    transform="translateY(-50%)"
                >
                    <IconButton
                        data-testid="product-scroller-nav-right"
                        aria-label="Scroll products right"
                        icon={<ChevronRightIcon color="black" />}
                        borderRadius="full"
                        colorScheme="whiteAlpha"
                        onClick={() => scroll(1)}
                    />
                </Box>
            </Fragment>
        </Box>
    )
}

Carousel.propTypes = {
    textHeadline: PropTypes.string,
    regions: PropTypes.array,
    xsCarouselIndicators: PropTypes.bool,
    smCarouselIndicators: PropTypes.bool,
    mdCarouselIndicators: PropTypes.bool,
    xsCarouselControls: PropTypes.bool,
    smCarouselControls: PropTypes.bool,
    xsCarouselSlidesToDisplay: PropTypes.oneOf[(1, 2, 3, 4, 5, 6)],
    smCarouselSlidesToDisplay: PropTypes.oneOf[(1, 2, 3, 4, 5, 6)],
    mdCarouselSlidesToDisplay: PropTypes.oneOf[(1, 2, 3, 4, 5, 6)]
}

export default Carousel
