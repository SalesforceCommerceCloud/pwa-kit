import React, {forwardRef, useMemo} from 'react'
import AdaptiveImage from './AdaptiveImage'
import AdaptiveImageSource from './AdaptiveImageSource'
import PropTypes from 'prop-types'
//import { ImageFormat } from '../../../amplience/utils/getImageURL';

const TrueAdaptiveImage = (props) => {
    const {imageRef, imageAltText, transformations} = props

    const [xl, xlNorm, l, lNorm, t, tNorm, m, mNorm] = useMemo(() => {
        return [
            transformations
                ? {
                      ...transformations,
                      format: 'webp'
                  }
                : {
                      format: 'webp',
                      width: 1600,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations
                  }
                : {
                      width: 1600,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations,
                      format: 'webp',
                      width: transformations.width
                          ? Math.floor(transformations.width * 2)
                          : undefined,
                      height: transformations.height
                          ? Math.floor(transformations.height * 2)
                          : undefined
                  }
                : {
                      format: 'webp',
                      width: 1280,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations,
                      width: transformations.width
                          ? Math.floor(transformations.width * 2)
                          : undefined,
                      height: transformations.height
                          ? Math.floor(transformations.height * 2)
                          : undefined
                  }
                : {
                      width: 1280,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations,
                      format: 'webp',
                      width: transformations.width
                          ? Math.floor(transformations.width * 2)
                          : undefined,
                      height: transformations.height
                          ? Math.floor(transformations.height * 2)
                          : undefined
                  }
                : {
                      format: 'webp',
                      width: 1024,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations,
                      width: transformations.width
                          ? Math.floor(transformations.width * 2)
                          : undefined,
                      height: transformations.height
                          ? Math.floor(transformations.height * 2)
                          : undefined
                  }
                : {
                      width: 1024,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations,
                      format: 'webp',
                      width: transformations.width
                          ? Math.floor(transformations.width * 2)
                          : undefined,
                      height: transformations.height
                          ? Math.floor(transformations.height * 2)
                          : undefined
                  }
                : {
                      format: 'webp',
                      width: 768,
                      aspectRatio: '2:1'
                  },
            transformations
                ? {
                      ...transformations,
                      width: transformations.width
                          ? Math.floor(transformations.width * 2)
                          : undefined,
                      height: transformations.height
                          ? Math.floor(transformations.height * 2)
                          : undefined
                  }
                : {
                      width: 768,
                      aspectRatio: '2:1'
                  }
        ]
    }, [transformations])

    const mainTransform = props.transformations ?? {}

    return (
        <AdaptiveImage
            ref={imageRef}
            imageAltText={imageAltText}
            {...props}
            transformations={mainTransform}
        >
            <AdaptiveImageSource
                media="(min-width: 1280px)"
                type="image/webp"
                transformations={xl}
            />
            <AdaptiveImageSource media="(min-width: 1280px)" transformations={xlNorm} />
            <AdaptiveImageSource
                media="(min-width: 1024px)"
                type="image/webp"
                transformations={l}
            />
            <AdaptiveImageSource media="(min-width: 1024px)" transformations={lNorm} />
            <AdaptiveImageSource media="(min-width: 768px)" type="image/webp" transformations={t} />
            <AdaptiveImageSource media="(min-width: 768px)" transformations={tNorm} />
            <AdaptiveImageSource media="(max-width: 768px)" type="image/webp" transformations={m} />
            <AdaptiveImageSource media="(max-width: 768px)" transformations={mNorm} />
        </AdaptiveImage>
    )
}

TrueAdaptiveImage.displayName = 'TrueAdaptiveImage'

TrueAdaptiveImage.propTypes = {
    imageRef: PropTypes.object,
    transformations: PropTypes.object,
    imageAltText: PropTypes.string
}

// eslint-disable-next-line react/display-name
export default forwardRef((props, ref) => <TrueAdaptiveImage imageRef={ref} {...props} />)
