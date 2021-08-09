import {connectHits, Highlight, Snippet} from 'react-instantsearch-dom'
import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import startCase from 'lodash.startcase'
import styled from '@emotion/styled'
import {useKeyPress} from '../../hooks/useKeyPress'
import {navigate} from 'gatsby'
import mediaqueries from '../../styles/media'
import {TabletOrSmaller, Default} from '../../hooks/useMedia'

import {Link} from 'gatsby'

const Hits = ({hits, setFocus}) => {
    const [cursor, setCursor] = useState(0)

    const downPress = useKeyPress('ArrowDown')
    useEffect(() => {
        if (hits.length && downPress) {
            setCursor((prevState) => (prevState < hits.length - 1 ? prevState + 1 : prevState))
        }
    }, [downPress])

    const upPress = useKeyPress('ArrowUp')

    useEffect(() => {
        if (hits.length && upPress) {
            setCursor((prevState) => (prevState > 0 ? prevState - 1 : prevState))
        }
    }, [upPress])

    const enterPress = useKeyPress('Enter')

    useEffect(() => {
        if (hits.length && enterPress) {
            navigate(hits[cursor].slug)
        }
    }, [enterPress])

    return (
        <SearchList>
            {hits.map((hit, i) => {
                const searchItemLinkClasses = cursor === i ? ' SearchItemLink--active' : ''

                return (
                    <ResultItem className="ais-Hits-Item" key={hit.objectID}>
                        <SearchItemLink
                            className={searchItemLinkClasses}
                            to={hit.slug}
                            onClick={() => setFocus(false)}
                        >
                            <TabletOrSmaller>
                                <Collection>
                                    {startCase(
                                        hit.collection === 'content' ? 'home' : hit.collection
                                    )}
                                </Collection>
                            </TabletOrSmaller>
                            <SearchItemTitle attribute="metaTitle" hit={hit} tagName="mark" />
                            <SearchContent>
                                <Highlight attribute="title" hit={hit} tagName="mark" />
                                <ModifiedSnippet attribute="excerpt" hit={hit} tagName="mark" />
                                <Default>
                                    <Collection>
                                        {startCase(
                                            hit.collection === 'content' ? 'home' : hit.collection
                                        )}
                                    </Collection>
                                </Default>
                            </SearchContent>
                        </SearchItemLink>
                    </ResultItem>
                )
            })}
        </SearchList>
    )
}

const SearchList = styled.ol`
    margin: 0;
    padding: 0;
`

const ModifiedSnippet = styled(Snippet)`
    flex: 2;
    margin-right: ${(p) => p.theme.space.md};

    mark {
        background-color: transparent;
        font-weight: 700;
    }
`

const ResultItem = styled.li`
    list-style-type: none;
`

const SearchContent = styled.div`
    display: flex;
    font-size: ${(p) => p.theme.fontSizes.sm};
`

const Collection = styled.div`
    font-weight: bold;
    flex: 1;
    text-align: right;
    text-transform: uppercase;
    color: ${(p) => p.theme.colors.mediumGray};

    ${(p) => mediaqueries.tablet`
        text-align: left;
        margin-bottom: ${p.theme.space.xs};
    `};
`

const SearchItemLink = styled(Link)`
    text-decoration: none;
    padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.xxl} 0 ${(p) => p.theme.space.xxl};
    font-size: ${(p) => p.theme.fontSizes.sm};
    color: ${(p) => p.theme.colors.text};
    display: block;
    position: relative;

    ${(p) => mediaqueries.tablet`
        padding: ${p.theme.space.md} ${p.theme.space.md} 0 ${p.theme.space.md};
    `};

    &.SearchItemLink--active,
    :active,
    :focus {
        background: ${(p) => p.theme.colors.mediumSilver};
        outline: none;
        :before {
            content: ' ';
            position: absolute;
            border-left: 4px solid ${(p) => p.theme.colors.secondary};
            height: 100%;
            top: 0;
            left: 0;
        }

        :after {
            border-color: transparent;
        }
    }

    &:after {
        content: ' ';
        padding-top: ${(p) => p.theme.space.md};
        display: block;
        border-bottom: 1px solid #c4c8d8;
    }

    &:hover {
        background: ${(p) => p.theme.colors.mediumSilver};
    }
`

const SearchItemTitle = styled(Highlight)`
    margin-bottom: ${(p) => p.theme.space.xs};
    font-size: ${(p) => p.theme.fontSizes.md};
    color: ${(p) => p.theme.colors.brightBlue};

    mark {
        background-color: transparent;
        font-weight: 700;
        color: ${(p) => p.theme.colors.brightBlue};
    }
`

Hits.propTypes = {
    hits: PropTypes.array.isRequired,
    setFocus: PropTypes.func.isRequired
}

export const CustomHits = connectHits(Hits)
