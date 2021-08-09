/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import throttle from 'lodash.throttle'

import {isDataURL} from '../../utils/assets'
import Ratio from '../ratio'
import SkeletonBlock from '../skeleton-block'

const noop = () => undefined
const runningServerSide = () => typeof window === 'undefined'

// Detect if the browser is IE11
// As seen here: https://stackoverflow.com/questions/21825157/internet-explorer-11-detection
const isIEEleven = () => !!window.MSInputMethodContext && !!document.documentMode

/**
 * An image component with placeholder functionality baked-in.
 * You can review the documentation for the [placeholder component here](#!/SkeletonBlock).
 * placeholder functionality is not supported in IE11
 * this is due to a bug in how IE11 handles the onload event for images
 * Note: The Image must have an explicit height for placeholder to appear.
 */
class Image extends React.PureComponent {
    constructor(props) {
        super(props)

        this.state = {
            transitioningImageProps: null,
            // If we're lazy loading default the isVisible state to false
            // If we're not set it to true to skip the lazy loading behaviour
            isVisible: (props && !props.shouldLazyLoad) || false,
            // Similarly, we want to default the loaded state to true when
            // not lazy loading so that the SSR-only output renders the image;
            // the client-side behaviour is handled in componentDidMount().
            loaded: (props && !props.shouldLazyLoad) || false
        }

        this.imageLoaded = this.imageLoaded.bind(this)
        this.isVisible = this.isVisible.bind(this)
        this.checkIfVisible = this.checkIfVisible.bind(this)
        this.skipPlaceHolder = this.skipPlaceHolder.bind(this)

        this.handleBrowserScroll = throttle(this.handleBrowserScroll.bind(this), 300)
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.src !== nextProps.src) {
            const {alt, height, sizes, src, srcSet, width} = this.props
            const tagClasses = classNames('pw-image__tag', 'pw--is-transitioning')
            const imageProps = {
                src,
                srcSet,
                sizes,
                className: tagClasses,
                alt,
                height,
                width
            }
            this.setState({loaded: false, transitioningImageProps: imageProps})
        }
    }

    isVisible() {
        if (!this._container) {
            return false
        }
        const bounds = this._container.getBoundingClientRect()
        // check innerWidth/Height and clientWidth/Height for browser compatibility
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight
        const {lazyLoadThreshold} = this.props

        if (
            Math.abs(bounds.right) - viewportWidth <= lazyLoadThreshold ||
            Math.abs(bounds.left) - viewportWidth <= lazyLoadThreshold
        ) {
            // the image is within the width of the browser + the threshold
            if (Math.abs(bounds.top) - viewportHeight <= lazyLoadThreshold) {
                // The top of the image is within the height of the browser + the threshold
                return true
            }
        }
        return false
    }

    handleBrowserScroll() {
        // wrapper function for checkIfVisible so we can throttle the version that is called on scroll
        this.checkIfVisible()
    }

    clearScrollHandlers() {
        // Remove scroll handlers
        window.removeEventListener('scroll', this.handleBrowserScroll)
        window.removeEventListener('resize', this.handleBrowserScroll)
    }

    checkIfVisible() {
        const {isVisible} = this.state
        // If the image is already visible, don't recheck it
        if (isVisible) {
            return true
        }
        const componentIsVisible = this.isVisible()
        if (componentIsVisible) {
            this.setState({isVisible: true})
            this.clearScrollHandlers()
        }

        return componentIsVisible
    }

    skipPlaceHolder() {
        // When running on the server-side, we want the output to contain the
        // image tag (no placeholder) so that they're visible without JavaScript.
        // However, if the image is marked as lazily-loaded, we'll avoid this
        // behaviour.
        return runningServerSide()
            ? !this.props.shouldLazyLoad
            : isIEEleven() || isDataURL(this.props.src || '')
    }

    componentDidMount() {
        const {isVisible} = this.state

        // IE 11 won't trigger the onload event if images are loaded from the cache
        // If we're in IE11 then skip our placeholder behaviour
        // the IE 11 bug is mentioned here: https://stackoverflow.com/questions/16797786/image-load-event-on-ie
        const skipPlaceholderBehaviour = this.skipPlaceHolder()

        // If the image has already loaded (could occur for server side rendered apps)
        // set the loaded state to true, otherwise the app will need to force an
        // update on this component so the image will be made visible
        const hasAlreadyLoaded = this.el && this.el.complete && isVisible

        // Finally, update the `loaded` state.
        const loaded = skipPlaceholderBehaviour || hasAlreadyLoaded
        this.setState({loaded})

        if (!loaded && !isVisible) {
            // check if the container is visible
            const isContainerVisible = this.checkIfVisible()
            if (!isContainerVisible) {
                // add a scroll handler
                window.addEventListener('scroll', this.handleBrowserScroll)
                window.addEventListener('resize', this.handleBrowserScroll)
            } else {
                // Remove scroll handlers if the element is already visible
                this.clearScrollHandlers()
            }
        }
    }

    componentWillUnmount() {
        // Clear the loading timeout so we don't call setState on an unmounted component
        if (this.timeout) {
            window.clearTimeout(this.timeout)
        }
        this.clearScrollHandlers()
    }

    imageLoaded() {
        this.timeout = setTimeout(() => {
            this.setState({loaded: true, transitioningImageProps: null}, this.props.onImageLoaded)
        }, this.props.artificialLoadingDelay || 0)
    }

    render() {
        const {
            alt,
            src,
            draggable,
            className,
            height,
            hidePlaceholder,
            itemProp,
            loadingIndicator,
            placeholderStyle,
            ratio,
            // Responsive Image Props
            sizes,
            srcSet,

            width,
            useLoaderDuringTransitions,
            onImageError,
            imageStyle,
            wrapperStyle
        } = this.props
        const {loaded, isVisible, transitioningImageProps} = this.state

        const classes = classNames(
            'pw-image',
            {
                'pw--is-loaded': loaded
            },
            className
        )

        const skeletonStyle = {
            ...placeholderStyle,
            height,
            width
        }

        const imageProps = {
            sizes,
            className: classNames('pw-image__tag', {
                'u-visually-hidden': !loaded
            }),
            alt,
            height,
            width,
            itemProp,
            draggable,
            style: imageStyle,
            ref: (el) => {
                this.el = el
            }
        }

        if (isVisible || this.skipPlaceHolder()) {
            imageProps.src = src
            imageProps.srcSet = srcSet
        }

        // alt is in imageProps
        /* eslint-disable jsx-a11y/img-has-alt */
        const loaderNode =
            useLoaderDuringTransitions || transitioningImageProps === null ? (
                <span>
                    {loadingIndicator}
                    {!hidePlaceholder && (
                        <SkeletonBlock type="div" className="pw--image" style={skeletonStyle} />
                    )}
                </span>
            ) : (
                // Image src is changing but we will continue displaying the previous image
                // until the new one is finished loading, to allow for instant swap
                <img {...transitioningImageProps} />
            )

        const image = (
            <span>
                {!loaded && loaderNode}
                <img {...imageProps} onLoad={this.imageLoaded} onError={onImageError} />
            </span>
        )
        /* eslint-enable jsx-a11y/img-has-alt */

        return (
            <div
                className={classes}
                ref={(el) => {
                    this._container = el
                }}
                style={wrapperStyle}
            >
                {ratio ? <Ratio {...ratio}>{image}</Ratio> : image}
            </div>
        )
    }
}

Image.defaultProps = {
    alt: '',
    draggable: 'auto',
    height: 'auto',
    lazyLoadThreshold: 0,
    shouldLazyLoad: false,
    src: '',
    placeholderStyle: {},
    onImageLoaded: noop,
    useLoaderDuringTransitions: true,
    width: '100%',
    wrapperStyle: {},
    imageStyle: {}
}

Image.propTypes = {
    /**
     * This attribute defines the alternative text describing the image.
     */
    alt: PropTypes.string.isRequired,

    /**
     * This is the image URL.
     */
    src: PropTypes.string.isRequired,

    /**
     * This attribute defines an artificial delay (ms) that slows down when the image is considered loaded.
     * Note that this prop only works if the image is not included in the initial server-side rendering of the page.
     */
    artificialLoadingDelay: PropTypes.number,

    /**
     * A CSS class name to be applied to the <img /> element.
     */
    className: PropTypes.string,

    /**
     * Used to determine if the image should be draggable.
     */
    draggable: PropTypes.string,

    /**
     * The intrinsic height of the image in HTML5 CSS pixels, or HTML 4 in pixels or as a percentage.
     */
    height: PropTypes.string,

    /**
     * Used to determine if the image placeholder should be shown while the image loads.
     */
    hidePlaceholder: PropTypes.bool,

    /**
     * Inline styles for the img component.
     */
    imageStyle: PropTypes.object,

    /**
     * A value for the itemprop attribute
     * used to provide microdata to a page for SEO
     * https://www.w3.org/TR/microdata/
     */
    itemProp: PropTypes.string,

    /**
     * If shouldLazyLoad is set to true, this number defines how close (in pixels)
     * to the bounds of the viewport the image should be before we start loading it
     * Example: If set to 200 the image will begin loading when it is within 200
     * pixels of the browser viewport
     */
    lazyLoadThreshold: PropTypes.number,

    /**
     * Additional content to show with the placeholder while the image loads.
     */
    loadingIndicator: PropTypes.node,

    /**
     * An object whose key is the camelCased version of the style name, and whose value is the style's value, usually a string.
     */
    placeholderStyle: PropTypes.object,

    /**
     * Props for a Ratio component. See the [Ratio](#!/Ratio) component for more details.
     * Example: `{aspect: '4:3'}`
     */
    ratio: PropTypes.object,

    /**
     * Indicates if the image should be lazy loaded
     * If true the image will only start loading when it is onscreen
     * or close to being on screen within the lazyLoadThreshold value
     * Example: with a lazyLoadThreshold value of 200, images will
     * begin loading while offscreen if they are within 200px of being on screen
     */
    shouldLazyLoad: PropTypes.bool,

    /**
     * An array of one or more strings indicating a set of source sizes. Each string is composed of:
     1. A media condition that may be omitted for the last item.
     2. A source size value
     See http://mdn.io/img
     */
    sizes: PropTypes.array,

    /**
     * An array of one or more strings indicating a set of image sources. Each string is composed of:
     1. A URL to an image.
     2. (Optionally, after a space) A width or pixel density descriptor.
     If no srcSet matches, the browser will default to using the src prop
     See http://mdn.io/img
     */
    srcSet: PropTypes.array,

    /**
     * Indicates whether to display the loaderNode or the old image when src is changed (while the new image loads)
     */
    useLoaderDuringTransitions: PropTypes.bool,

    /**
     * The intrinsic width of the image in HTML5 CSS pixels, or HTML 4 in pixels or as a percentage.
     */
    width: PropTypes.string,

    /**
     * Inline styles for the div component that wraps the img component.
     * Styles related to 'position' should be added to the wrapperStyle
     * instead of the imageStyle, otherwise they may not work as expected.
     */
    wrapperStyle: PropTypes.object,

    /**
     * A callback that gets called when the image is failed to load.
     */
    onImageError: PropTypes.func,

    /**
     * A callback that gets called when the image is loaded and displayed.
     */
    onImageLoaded: PropTypes.func
}

export default Image
