import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'

//Amplience Rendering Templates
import Hero from '../hero'
import Section from '../section'
import CuratedProductList from '../curated-product-list'
import CardEnhanced from '../card-enhanced'
// Slots
import flexibleListSlot from '../flexibleListSlot'
import {useIntl} from 'react-intl'
import {AmplienceContext} from '../../../contexts/amplience'
import {Skeleton} from '@chakra-ui/react'
import PersonalisedContainer from '../personalised-container'
import PersonalisedComponent from '../personalised-component'
import ShoppableImage from '../shoppable-image'
import AdditionalInformation from '../toolbar/additionalInformation'
import AmplienceRichText from '../rich-text'
import CardList from '../card-list'
import {useLocation} from 'react-router-dom'
import ShoppableVideo from '../shoppable-video'
import Features from '../features'
import GridLock from '../grid-lock'
import Brightcove from '../brightcove'
import FormBuilder from '../form-builder'
import Stylitics from '../stylitics'

const Blank = () => <></>

const componentsMapping = {
    'https://sfcc.com/components/hero': Hero,
    'https://sfcc.com/components/section': Section,
    'https://sfcc.com/components/rich-text': AmplienceRichText,
    'https://sfcc.com/components/curated-product': CuratedProductList,
    'https://sfcc.com/components/card-enhanced': CardEnhanced,
    'https://sfcc.com/components/personalised-component': PersonalisedComponent,
    'https://sfcc.com/components/personalised-ingrid-component': PersonalisedComponent,
    'https://sfcc.com/components/personalised-container': PersonalisedContainer,
    'https://sfcc.com/components/shoppable-image': ShoppableImage,
    'https://sfcc.com/components/shoppable-video': ShoppableVideo,
    'https://sfcc.com/slots/flexible-list': flexibleListSlot,
    'https://sfcc.com/slots/personalised-slot': flexibleListSlot,
    'https://sfcc.com/components/card-list': CardList,
    'https://sfcc.com/components/features': Features,
    'https://sfcc.com/components/grid-lock': GridLock,
    'https://sfcc.com/components/video': Brightcove,
    'https://sfcc.com/components/form-builder': FormBuilder,

    'https://sfcc.com/content/stylitics/generic': Stylitics,
    'https://sfcc.com/content/stylitics/classic': Stylitics,
    'https://sfcc.com/content/stylitics/hotspots': Stylitics,
    'https://sfcc.com/content/stylitics/main-and-detail': Stylitics,
    'https://sfcc.com/content/stylitics/gallery': Stylitics,
    'https://sfcc.com/content/stylitics/moodboard': Stylitics,

    'https://sfcc.com/site/navigation/root': Blank,
    'https://sfcc.com/site/navigation/external': Blank,
    'https://sfcc.com/site/navigation/internal': Blank,
    'https://sfcc.com/site/navigation/content-page': Blank,
    'https://sfcc.com/site/navigation/category': Blank,
    'https://sfcc.com/site/navigation/group': Blank,
}

const AmplienceWrapper = ({fetch, content, components, skeleton, rtvActive, ...rest}) => {
    const {client, groups} = useContext(AmplienceContext)
    const [fetchedContent, setFetchedContent] = useState(content)
    const {locale} = useIntl()
    const location = useLocation()
    const activeParams = new URLSearchParams(location.search || '')
    const showInfo =
        (activeParams &&
            ((activeParams.has('vse') && activeParams.get('vse')) ||
                (activeParams.has('pagevse') && activeParams.get('pagevse')))) ||
        rtvActive

    const mapping = components ? {...componentsMapping, ...components} : componentsMapping

    useEffect(() => {
        let active = true

        const fetchCont = async () => {
            const data = await client.fetchContent([fetch], {locale})
            if (active) {
                setFetchedContent(data.pop())
            }
        }
        if (fetch) {
            fetchCont()
        } else if (content !== fetchedContent) {
            setFetchedContent(content)
        }

        return () => (active = false)
    }, [fetch?.id, fetch?.key, content, groups])

    const Component = mapping[fetchedContent?._meta?.schema]

    const result = Component ? (
        <div style={{position: 'relative', width: '100%'}}>
            {showInfo ? <AdditionalInformation {...fetchedContent} /> : ''}
            <Component {...fetchedContent} {...rest} />
        </div>
    ) : (
        <>{JSON.stringify(fetchedContent)}</>
    )

    return skeleton ? (
        <Skeleton {...skeleton} isLoaded={fetchedContent != null}>
            {result}
        </Skeleton>
    ) : (
        result
    )
}

AmplienceWrapper.displayName = 'Amplience Wrapper Block'

AmplienceWrapper.propTypes = {
    fetch: PropTypes.object,
    content: PropTypes.object,
    components: PropTypes.object,
    skeleton: PropTypes.object,
    rtvActive: PropTypes.bool
}

export default AmplienceWrapper
