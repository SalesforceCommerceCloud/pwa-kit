import React, {useState, useEffect, useContext, useRef} from 'react'
import PropTypes from 'prop-types'
import algoliasearch from 'algoliasearch/lite'
import {InstantSearch, Index, connectStateResults, Configure} from 'react-instantsearch-dom'
import config from '../../../config.js'
import styled from '@emotion/styled'
import Input from './input'
import {CustomHits} from './hits'
import mediaqueries from '../../styles/media'
import {GlobalStateContext} from '../../context/GlobalContextProvider'
import {TabletOrSmaller} from '../../hooks/useMedia'

const HitsWrapper = styled.div`
    z-index: 13;
    -webkit-overflow-scrolling: touch;
    position: absolute;
    top: calc(100% + 2px);
    width: 100%;
    padding: ${(p) => p.theme.space.md} 0;
    background-color: white;

    border-radius: ${(p) => p.theme.radii.sm};
    border: 1px solid #ccc;
    box-shadow: ${(p) => p.theme.shadows.medium};
    height: auto;
    left: 0;

    ${(p) => mediaqueries.tablet`
        border-radius: 0;
        border-width: 0;
        box-shadow: inset 0px 10px 8px -12px rgba(0,0,0,0.7);
        height: calc(100vh - ${p.theme.headerHeight} - ${p.bannerHeight}px);
        top: 100%;
        overflow: scroll;
        
        padding-bottom: 100px; // avoid the browsers action bar at the bottom on mobiles
    `};
`

const InputWrapper = styled.div`
    display: flex;
    position: relative;
    align-items: center;
`

const NoResultWrapper = styled.div`
    padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.xxl};
`

const Results = connectStateResults(({searchState: state, searchResults: res, children}) => {
    return res && res.query && res.nbHits > 0 ? (
        children
    ) : (
        <NoResultWrapper>No results for {state.query}</NoResultWrapper>
    )
})

export default function SearchComponent({isInputFocus, setFocus, indices}) {
    const [query, setQuery] = useState(``)
    const searchClient = algoliasearch(
        config.header.search.algoliaAppId,
        config.header.search.algoliaSearchKey
    )
    const state = useContext(GlobalStateContext)

    const displayResult = query.length > 0 && isInputFocus

    const handleKeyPress = (e) => {
        if (e.keyCode === 9) {
            setFocus(false)
        }
        if (e.keyCode === 27) {
            setFocus(false)
            e.target.blur()
        }
    }

    useEffect(() => {
        if (isInputFocus) {
            document.body.classList.add('no-scroll')
        } else {
            document.body.classList.remove('no-scroll')
        }
    })

    return (
        <InstantSearch
            searchClient={searchClient}
            indexName={indices[0].name}
            onSearchStateChange={({query}) => setQuery(query)}
        >
            <InputWrapper>
                <Input
                    onFocus={() => setFocus(true)}
                    isInputFocus={isInputFocus}
                    onKeyDown={handleKeyPress}
                />
                {isInputFocus && (
                    <TabletOrSmaller>
                        <CancelButton onClick={() => setFocus(false)}>Cancel</CancelButton>
                    </TabletOrSmaller>
                )}
            </InputWrapper>

            {displayResult && (
                <HitsWrapper bannerHeight={state.bannerHeight}>
                    {indices.map(({name}) => {
                        return (
                            <Index key={name} indexName={name}>
                                <Results>
                                    <CustomHits setFocus={setFocus} />
                                </Results>
                            </Index>
                        )
                    })}
                    <Configure hitsPerPage={6} />
                </HitsWrapper>
            )}
        </InstantSearch>
    )
}

const CancelButton = styled.div`
    color: ${(p) => p.theme.colors.white};
    margin-left: ${(p) => p.theme.space.md};
    cursor: pointer;
`

SearchComponent.propTypes = {
    isInputFocus: PropTypes.bool.isRequired,
    setFocus: PropTypes.func.isRequired,
    indices: PropTypes.array
}
