import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {Box, Link, Heading, Stack, useMultiStyleConfig, Skeleton} from '@chakra-ui/react'
import TrueAdaptiveImage from '../adaptive-image/TrueAdaptiveImage'
import styled from '@emotion/styled'

const gcd = (a, b) => {
    return b == 0 ? a : gcd(b, a % b)
}

const Contain = styled('div')`
  height: 100%;
  position: relative;
  margin: 0;
  display: block;
  
  span {
    margin-top: 0 !important;
  }

  @media (min-width: 1024px) and (max-width: 1200px) {
    .hover,
    .blend {
      padding: 9px !important;
    }

    &:hover .text-pane {
      background: rgba(255, 255, 255, 0.9) !important;
    }

    .text-pane {
      width: 80% !important;
    }

    .text-pane h2 {
      font-size: 18px !important;
    }

    .text-pane p {
      font-size: 14px !important;
    }

    .text-pane span {
      font-size: 12px !important;
    }
  }
  @media (min-width: 768px) and (max-width: 1024px) {
    .hover,
    .blend {
      padding: 10px !important;
    }

    .text-pane {
      width: 100% !important;
    }

    .text-pane h2 {
      font-size: 16px !important;
    }

    .text-pane p {
      font-size: 12px !important;
    }

    .text-pane span {
      font-size: 12px !important;
    }
  }
  @media (max-width: 1024px) {
    .hover,
    .blend {
      padding: 4px !important;
    }

    .text-pane { {
      width: 85% !important;

      h2, p {
        font-size: 12px !important;
      }
    }
    }

    @media (max-width: 460px) {
      .text-pane { {
        width: 85% !important;

        h2 {
          font-size: 11px !important;
        }

        p {
          display: none;
        }
      }
      }

      span {
        text-decoration: underline;
        text-transform: uppercase;
        font-weight: bold;
      }
`

const InGridHero = ({
    title,
    img,
    actions = [],
    textAlign = 'Left',
    justifyContent = 'Left',
    alignItems = 'Center',
    cols,
    rows,
    gap,
    ...props
}) => {
    const styles = useMultiStyleConfig('Hero', {variant: 'inGrid'})
    const parentRef = useRef()
    const imageRef = useRef()

    const h = parentRef.current?.clientHeight == 0 ? 400 : parentRef.current?.clientHeight
    const w = parentRef.current?.clientWidth == 0 ? 400 : parentRef.current?.clientWidth
    const [imageLoading, setImageLoading] = useState(true)
    const [height, setHeight] = useState(400)
    const [width, setWidth] = useState(400)
    const [ratio, setRatio] = useState('1:1')

    useEffect(() => {
        let r, ratio

        if (w && h) {
            r = gcd(w, h)
            setWidth(Math.floor(w / cols))
            setHeight(Math.floor(h / rows))
            ratio =
                cols === rows ? w / r + ':' + h / r : (w / cols) * cols + ':' + (h / rows) * rows
            setRatio(ratio)
            setImageLoading(img.image != null)
        }
    }, [w, h, cols, rows, img.image])

    let compHeight = 'auto'
    if (cols && rows && gap) {
        // Force the height to a fraction of the width (minus gap)
        compHeight = (rows * (w - gap * (cols - 1))) / cols + (rows - 1) * gap + 'px'
    }

    const cardTransformations = {
        ...img?.image,
        upscale: true,
        strip: true,
        quality: 80,
        width: width * cols,
        height: height * rows,
        aspectRatio: ratio,
        scaleMode: 'c',
        query: img?.query
    }

    const content = (
        <Contain>
            <Stack {...styles.stackContainer}>
                <Skeleton
                    isLoaded={!imageLoading}
                    sx={{width: '100%', height: compHeight}}
                    style={{
                        justifyContent: justifyContent.toLowerCase(),
                        alignItems: alignItems.toLowerCase(),
                        display: 'flex'
                    }}
                >
                    <Stack
                        className="text-pane"
                        style={{display: `${imageLoading ? 'none' : 'flex'}`}}
                        {...styles.textContainer}
                        textAlign={{base: 'center', md: textAlign.toLowerCase()}}
                        position={{base: 'absolute'}}
                    >
                        <Heading
                            as="h2"
                            fontSize={{base: 'md', md: '4xl', lg: '6xl'}}
                            maxWidth={{base: 'full'}}
                            {...styles.heading}
                        >
                            {title}
                        </Heading>
                        {actions.map(({label}, ind) => {
                            if (label) {
                                return <span key={ind}>{label}</span>
                            }
                            return null
                        })}
                    </Stack>
                    <div
                        className="img-place"
                        style={{display: `${imageLoading ? 'none' : 'block'}`, width: '100%'}}
                    >
                        <TrueAdaptiveImage
                            style={{...styles.image}}
                            ref={imageRef}
                            alt={img?.alt}
                            onLoad={() => setImageLoading(false)}
                            image={img?.image}
                            transformations={cardTransformations}
                        />
                    </div>
                </Skeleton>
            </Stack>
        </Contain>
    )

    return (
        <Box
            ref={parentRef}
            {...styles.container}
            sx={{width: '100%', height: compHeight}}
            {...props}
        >
            {actions[0]?.url ? <Link href={actions[0]?.url}>{content}</Link> : content}
        </Box>
    )
}

InGridHero.displayName = 'InGridHero'

InGridHero.propTypes = {
    /**
     * Hero component image
     */
    img: PropTypes.shape({
        image: PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string,
            endpoint: PropTypes.string,
            defaultHost: PropTypes.string
        }),
        alt: PropTypes.string,
        query: PropTypes.string
    }),
    /**
     * Hero component main title
     */
    title: PropTypes.string,
    /**
     * Call to action component(s)
     */
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            url: PropTypes.string
        })
    ),
    /**
     * Hero button label
     */
    label: PropTypes.string,
    /**
     * Hero button url
     */
    url: PropTypes.string,
    /**
     * Hero text alignment
     */
    textAlign: PropTypes.string,
    /**
     * Hero justify content
     */
    justifyContent: PropTypes.string,
    /**
     * Hero align items
     */
    alignItems: PropTypes.string,
    /**
     * Grid item props
     */
    cols: PropTypes.number,
    rows: PropTypes.number,
    gap: PropTypes.number
}

export default InGridHero
