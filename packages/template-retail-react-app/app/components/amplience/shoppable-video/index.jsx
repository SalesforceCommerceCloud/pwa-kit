import React, {useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Button,
    Heading,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerBody,
    Modal,
    ModalOverlay,
    ModalCloseButton,
    ModalBody,
    ModalContent,
    useDisclosure,
    useMultiStyleConfig,
    useBreakpointValue
} from '@chakra-ui/react'
import styled from '@emotion/styled'
import {useLayoutEffect} from 'react'
import useResizeObserver from '@react-hook/resize-observer'
import {getVideoUrl} from '../../../utils/amplience/image'
import {useEffect} from 'react'
import {useShoppableTooltip} from '../shoppable-image'
import Link from '../link'
import AmplienceWrapper from '../wrapper'
import ProductViewModal from '../product-view-modal'
import {categoryUrlBuilder, productUrlBuilder} from '../../../utils/url'
import {useCallback} from 'react'

const Contain = styled(Box)`
    @keyframes targetHover {
        0% {
            opacity: 100%;
            border-width: 3px;
            transform: scale(1, 1);
        }
        100% {
            opacity: 0%;
            border-width: 2px;
            transform: scale(3, 3);
        }
    }

    .arrowHead::before {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 8px;
        border: 3px solid white;
        opacity: 0%;
    }

    .arrowHead:hover::before {
        animation: targetHover 0.75s;
        animation-iteration-count: infinite;
    }

    .arrowHeadHover::before {
        animation: targetHover 0.75s;
        animation-iteration-count: infinite;
    }

    .arrowHead:hover {
        transform: scale(1.6, 1.6);
    }

    .arrowHeadHover {
        transform: scale(1.6, 1.6);
    }
`

const pointLerp = (p1, p2, t) => {
    const fac = (t - p1.t) / (p2.t - p1.t)
    const inv = 1 - fac

    return {
        x: fac * p2.p.x + inv * p1.p.x,
        y: fac * p2.p.y + inv * p1.p.y
    }
}

const getHotspotPoint = (time, hotspot) => {
    // Determine the range which we're in on the hotspot timeline.
    if (!hotspot?.timeline?.points) {
        return undefined
    }

    const timeline = hotspot.timeline.points

    if (timeline.length == 0 || timeline[0].t > time) {
        return undefined
    }

    let previous = timeline[0]

    for (let i = 1; i < timeline.length; i++) {
        const point = timeline[i]

        if (point.t >= time) {
            if (previous.e) {
                return undefined
            } else {
                return pointLerp(previous, point, time)
            }
        }

        previous = point
    }

    if (previous.e && time > previous.t) {
        return undefined
    } else {
        return previous.p
    }
}

const getHotspotCta = (time, hotspot) => {
    // Find the latest cta position that is behind or equal to the current time.
    if (!hotspot?.timeline?.points) {
        return undefined
    }

    const timeline = hotspot.timeline.points

    for (let i = timeline.length - 1; i >= 0; i--) {
        const point = timeline[i]

        if (point.t <= time && point.cta && point.cta.x != null && point.cta.y != null) {
            return point.cta
        }
    }

    // If there is no timepoint behind or equal to the current time (invald state?), just return the midpoint.
    return {x: 0.5, y: 0.5}
}

const selectMediaSubset = (media, targetHeight) => {
    // Select the media entries with the highest bitrate for their given format.
    const formatMap = new Map()

    for (const item of media) {
        const format = `${item.format}/${item['video.codec']}`
        const diff = Math.abs(targetHeight - Number(item.height))

        const best = formatMap.get(format)
        const bestDiff = Math.abs(targetHeight - Number(best?.height ?? 0))

        if (!best || diff < bestDiff) {
            // If the bitrate is higher or this format hasn't been seen before, add it to the thing.
            formatMap.set(format, item)
        }
    }

    return Array.from(formatMap.values())
}

const formatToHtml = (format) => {
    if (format === 'mpeg4') {
        return 'mp4'
    }

    return format
}

const videoLoop = (token) => {
    if (token.active) {
        const time = token.video.currentTime + (token.playing ? token.offset : 0)
        if (token.playing || token.lastTime != time) {
            token.setTime(time)
            token.lastTime = time
        }

        requestAnimationFrame(() => videoLoop(token))
    }
}

const ShoppableVideoArrow = ({transform, width, clickTarget, hovered, ...props}) => {
    const {arrowContainer, arrowBody, arrowHead, arrowHeadContainer} = useMultiStyleConfig(
        'ShoppableVideo'
    )

    const dynamicStyle = {
        transform,
        width: width + 'px',
        ...props
    }

    return (
        <Box {...arrowContainer} style={dynamicStyle}>
            <Box {...arrowBody} style={{width: width - 20 + 'px'}} />
            <Box
                {...arrowHeadContainer}
                onClick={clickTarget}
                className={hovered ? 'arrowHead arrowHeadHover' : 'arrowHead'}
            >
                <Box {...arrowHead} />
            </Box>
        </Box>
    )
}

ShoppableVideoArrow.displayName = 'ShoppableVideoArrow'

ShoppableVideoArrow.propTypes = {
    transform: PropTypes.string,
    width: PropTypes.number,
    clickTarget: PropTypes.func,
    hovered: PropTypes.bool
}

const ShoppableVideoCta = ({
    target,
    selector,
    captions,
    scale,
    video,
    buttonRef,
    hoverButton,
    unhoverButton
}) => {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {label, qvProduct} = useShoppableTooltip(target, selector, captions)
    const sizeBias = 0.66
    const [oldPause] = useState({})

    const {ctaButton} = useMultiStyleConfig('ShoppableVideo')

    const onCloseWithUnpause = useCallback(() => {
        if (video && video.current.paused && !oldPause.paused) {
            video.current.play()
        }
        onClose()
    }, [onClose, video])

    const style = {
        style: {transform: `scale(${(scale - 1) * sizeBias + 1})`},
        ...ctaButton,
        ref: buttonRef,
        onMouseOver: hoverButton,
        onMouseOut: unhoverButton
    }

    switch (selector) {
        case 'product': {
            return (
                <Button as={Link} to={productUrlBuilder({id: target})} {...style}>
                    {label}
                </Button>
            )
        }
        case 'quickview': {
            return (
                <>
                    <Button
                        onClick={(evt) => {
                            const paused = video.current.paused
                            if (!paused) {
                                video.current.pause()
                            }
                            oldPause.paused = paused
                            onOpen()
                            evt.preventDefault()
                            return false
                        }}
                        {...style}
                    >
                        {label}
                    </Button>
                    {qvProduct && <ProductViewModal product={qvProduct} onClose={onCloseWithUnpause} isOpen={isOpen} />}
                </>
            )
        }
        case 'category': {
            return (
                <Button as={Link} to={categoryUrlBuilder({id: target})} {...style}>
                    {label}
                </Button>
            )
        }
        case 'link': {
            let link
            if (/^https?:\/\/|^\/\//i.test(target)) {
                link = '$' + target
            } else {
                link = target
            }
            return (
                <Button as={Link} to={link} {...style}>
                    {label}
                </Button>
            )
        }
        case 'page':
            // TODO: get page name?
            return (
                <Button as={Link} to={'/' + target} {...style}>
                    {label}
                </Button>
            )
        case 'tooltip': {
            if (label) {
                return (
                    <Button as={Link} {...style}>
                        {label}
                    </Button>
                )
            }

            return <></>
        }
        case 'contentKey': {
            return (
                <>
                    <Button
                        onClick={(evt) => {
                            const paused = video.current.paused
                            if (!paused) {
                                video.current.pause()
                            }
                            oldPause.paused = paused
                            onOpen()
                            evt.preventDefault()
                            return false
                        }}
                        {...style}
                    >
                        {label}
                    </Button>
                    <Drawer onClose={onCloseWithUnpause} isOpen={isOpen} size="xl">
                        <DrawerOverlay />
                        <DrawerContent>
                            <DrawerBody>
                                <DrawerCloseButton sx={{zIndex: 1}} />
                                <AmplienceWrapper fetch={{key: target}}></AmplienceWrapper>
                            </DrawerBody>
                        </DrawerContent>
                    </Drawer>
                </>
            )
        }
        case 'modal': {
            return (
                <>
                    <Button
                        onClick={(evt) => {
                            const paused = video.current.paused
                            if (!paused) {
                                video.current.pause()
                            }
                            oldPause.paused = paused
                            onOpen()
                            evt.preventDefault()
                            return false
                        }}
                        {...style}
                    >
                        {label}
                    </Button>
                    <Modal isOpen={isOpen} onClose={onCloseWithUnpause}>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalCloseButton />
                            <ModalBody>
                                <AmplienceWrapper fetch={{key: target}}></AmplienceWrapper>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </>
            )
        }
        default:
            return <></>
    }
}

ShoppableVideoCta.displayName = 'ShoppableVideoCta'

ShoppableVideoCta.propTypes = {
    target: PropTypes.string,
    selector: PropTypes.string,
    captions: PropTypes.array,
    width: PropTypes.number,
    scale: PropTypes.number,
    video: PropTypes.object,
    buttonRef: PropTypes.object,
    hoverButton: PropTypes.func,
    unhoverButton: PropTypes.func
}

const ShoppableVideoGroup = ({
    target,
    selector,
    captions,
    width,
    scale,
    video,
    ctaTransform,
    arrowTransform,
    visibility
}) => {
    const {ctaContainer} = useMultiStyleConfig('ShoppableVideo')

    const ref = React.createRef()
    const [hovered, setHovered] = useState(false)

    const clickTarget = useCallback(() => {
        if (ref.current) {
            ref.current.click()
        }
    }, [ref])

    const hoverButton = useCallback(() => {
        setHovered(true)
    })

    const unhoverButton = useCallback(() => {
        setHovered(false)
    })

    return (
        <>
            <ShoppableVideoArrow
                transform={arrowTransform}
                width={width}
                clickTarget={clickTarget}
                hovered={hovered}
                {...visibility}
            />
            <Box transform={ctaTransform} {...ctaContainer} style={{...visibility}}>
                <ShoppableVideoCta
                    target={target}
                    selector={selector}
                    captions={captions}
                    scale={scale}
                    video={video}
                    buttonRef={ref}
                    hoverButton={hoverButton}
                    unhoverButton={unhoverButton}
                ></ShoppableVideoCta>
            </Box>
        </>
    )
}

ShoppableVideoGroup.propTypes = {
    target: PropTypes.string,
    selector: PropTypes.string,
    captions: PropTypes.array,
    width: PropTypes.number,
    scale: PropTypes.number,
    video: PropTypes.object,
    ctaTransform: PropTypes.string,
    arrowTransform: PropTypes.string,
    visibility: PropTypes.object
}

const ShoppableVideo = ({
    title,
    shoppableVideo,
    videoAltText,
    seoText,
    captions,
    autoplay,
    width,
    height,
    rows,
    cols,
    gap,
    ...props
}) => {
    const target = useRef(null)
    const videoRef = useRef(null)
    const [size, setSize] = useState()
    const [videoSize, setVideoSize] = useState()
    const [videoMedia, setVideoMedia] = useState()
    const [time, setTime] = useState(0)
    const [targetRes, setTargetRes] = useState(0)

    const res = Math.max(useBreakpointValue([480, 480, 720, 720]), targetRes)

    useLayoutEffect(() => {
        if (target?.current) {
            setSize(target.current.getBoundingClientRect())
        }
    }, [target])

    useResizeObserver(target, (entry) => setSize(entry.contentRect))

    useEffect(() => {
        if (videoRef?.current) {
            // Bind video events.
            const video = videoRef.current
            const videoToken = {active: true, video, playing: false, setTime, offset: 0}

            video.onplay = () => (videoToken.playing = true)
            video.onpause = () => (videoToken.playing = false)
            video.onended = () => (videoToken.playing = false)

            videoLoop(videoToken)

            return () => (videoToken.active = false)
        }
    }, [videoRef, setTime])

    useEffect(async () => {
        setTargetRes(res)

        if (shoppableVideo?.video) {
            let cancelled = false

            // Determine the image size.
            let response = await fetch(getVideoUrl(shoppableVideo.video) + '.json?metadata=true')

            if (cancelled) return

            let json = await response.json()

            if (cancelled) return

            const media = selectMediaSubset(json.media, res)

            setVideoMedia(media)
            setVideoSize({width: media[0].width, height: media[0].height})

            return () => {
                cancelled = true
            }
        }
    }, [shoppableVideo?.video, res])

    if (!shoppableVideo?.video) {
        return <></>
    }

    const sources = (videoMedia ?? []).map((item, i) => (
        <source src={item.src} type={`video/${formatToHtml(item.format)}`} key={i} />
    ))

    const elements = []

    const videoStyle = {
        position: 'absolute',
        display: 'none',
        maxWidth: 'initial'
    }

    if (size && videoSize) {
        const containerAspect = size.width / size.height
        const videoAspect = videoSize.width / videoSize.height

        videoStyle.display = 'block'

        const scaleToFit = true
        let imgSize

        // Scale to fit wants to scale the largest overflowing dimension down to fit within the canvas.

        const fitW = scaleToFit ^ (videoAspect < containerAspect)

        if (fitW) {
            imgSize = [size.width, size.width / videoAspect]
        } else {
            imgSize = [size.height * videoAspect, size.height]
        }

        videoStyle.width = `${imgSize[0]}px`
        videoStyle.height = `${imgSize[1]}px`

        let imgPosition = [(size.width - imgSize[0]) / 2, (size.height - imgSize[1]) / 2]

        const sX = (x) => x * imgSize[0]
        const sY = (y) => y * imgSize[1]
        const tX = (x) => x * imgSize[0] + imgPosition[0]
        const tY = (y) => y * imgSize[1] + imgPosition[1]

        videoStyle.transform = `translate(${imgPosition[0]}px, ${imgPosition[1]}px)`

        // Generate video elements. Inactive elements just opacity: 0

        let i = 0
        const hotspots = shoppableVideo.hotspots ?? []
        for (let hotspot of hotspots) {
            const point = getHotspotPoint(time, hotspot)
            const ctaPoint = getHotspotCta(time, hotspot)

            const ctaTransform =
                ctaPoint === undefined ? '' : `translate(${tX(ctaPoint.x)}px, ${tY(ctaPoint.y)}px)`

            const visibility = {
                pointerEvents: point === undefined ? 'none' : 'inherit',
                opacity: point === undefined ? 0 : 1
            }

            // Arrow (cta point to point)

            const vec = {
                x: point ? sX(point.x - ctaPoint.x) : 0,
                y: point ? sY(point.y - ctaPoint.y) : 0
            }

            const arrowWidth = Math.sqrt(vec.x * vec.x + vec.y * vec.y)
            const rotate = Math.atan2(vec.y, vec.x)

            const arrowTransform = ctaTransform + ` rotate(${rotate}rad)`

            elements.push(
                <ShoppableVideoGroup
                    {...hotspot}
                    key={i++}
                    arrowTransform={arrowTransform}
                    ctaTransform={ctaTransform}
                    width={arrowWidth}
                    visibility={visibility}
                    captions={captions}
                    scale={size.width / 1000}
                    video={videoRef}
                />
            )
        }
    }

    props.width = width ?? '100%'

    if (cols && rows && gap && size) {
        // Force the height to a fraction of the width (minus gap)
        props.height = (rows * (size.width - gap * (cols - 1))) / cols + (rows - 1) * gap + 'px'
    } else if (height) {
        props.height = height
    } else if (videoSize && size) {
        props.height = size.width * (videoSize.height / videoSize.width)
    }

    if (autoplay) {
        videoStyle.autoPlay = 'autoplay'
        videoStyle.muted = true
        videoStyle.loop = true
    } else {
        videoStyle.controls = true
    }

    return (
        <Box overflow="hidden">
            {title && (
                <Heading
                    as="h2"
                    mt={4}
                    mb={4}
                    textAlign={'center'}
                    fontSize={{base: 'md', md: '3xl', lg: '4xl'}}
                >
                    {title}
                </Heading>
            )}
            <Contain {...props} ref={target} overflow="hidden" position="relative">
                <Box
                    as="video"
                    {...videoStyle}
                    alt={videoAltText}
                    objectFit="contain"
                    ref={videoRef}
                    playsInline
                >
                    {sources}
                </Box>
                {elements}
            </Contain>
        </Box>
    )
}

ShoppableVideo.displayName = 'ShoppableVideo'

ShoppableVideo.propTypes = {
    title: PropTypes.string,
    shoppableVideo: PropTypes.object,
    videoAltText: PropTypes.string,
    seoText: PropTypes.string,
    captions: PropTypes.array,
    autoplay: PropTypes.bool,
    width: PropTypes.number,
    height: PropTypes.number,
    rows: PropTypes.number,
    cols: PropTypes.number,
    gap: PropTypes.number
}

export default ShoppableVideo
