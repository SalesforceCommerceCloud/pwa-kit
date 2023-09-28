import React, {createContext, forwardRef} from 'react'
import PropTypes from 'prop-types'
import {getImageURL} from '../utils/getImageURL'
import {Image} from '@chakra-ui/react'

export const AdaptiveImageContext = createContext(null)

const AdaptiveImage = (props) => {
    const {image, transformations, imageAltText, children, imageRef, ...other} = props

    if (!image) {
        return null
    }

    const defaultImageUrl = getImageURL(image, transformations)

    return (
        <AdaptiveImageContext.Provider
            value={{
                image,
                transformations,
                imageAltText
            }}
        >
            <picture>
                {children}
                <Image
                    ref={imageRef}
                    src={defaultImageUrl}
                    fallbackSrc={`${defaultImageUrl}&w=1&qlt=1`}
                    alt={imageAltText}
                    {...other}
                />
            </picture>
        </AdaptiveImageContext.Provider>
    )
}

AdaptiveImage.displayName = 'AdaptiveImage'

AdaptiveImage.propTypes = {
    image: PropTypes.object,
    transformations: PropTypes.object,
    children: PropTypes.node,
    imageRef: PropTypes.object,
    imageAltText: PropTypes.string
}

// eslint-disable-next-line react/display-name
export default forwardRef((props, ref) => (
    // eslint-disable-next-line react/prop-types
    <AdaptiveImage {...props} imageRef={ref} imageAltText={props.imageAltText}>
        {props.children}
    </AdaptiveImage>
))
