import styled from '@emotion/styled'
import PropTypes from 'prop-types'
import React, {useState, useEffect} from 'react'
import mediaqueries from '../styles/media'
import ListItem from './ListItem'

const RightSidebar = ({location, isJsdocPage}) => {
    const [listItems, setListItems] = useState([])
    const [activeHash, setActiveHash] = useState(``)

    // On mount, look at the headings on the main content of the page and generate
    // a sidebar link for each one that has an id attribute.
    useEffect(() => {
        const hasHigherHeadings = Array.from(
            document.querySelector('main').querySelectorAll('h2, h3')
        ).length
        const items = Array.from(
            document.querySelector('main').querySelectorAll('h2, h3, h4'),
            (el) => {
                const id = el.getAttribute('id')

                // we only need function names without parameters in jsdoc pages.
                const title = isJsdocPage ? el.innerText.split('(')[0] : el.innerText
                return id
                    ? {
                          url: `#${id}`,
                          id: id,
                          title,
                          level: parseInt(el.tagName.replace('H', '')),
                          hasHigherHeadings
                      }
                    : null
            }
        ).filter((x) => x !== null)
        setListItems(items)

        let itemsIds = []
        items.forEach((item) => itemsIds.push(item.id))

        const previousObserver = {
            y: 0,
            ratio: 0,
            index: 0
        }

        const observer = new IntersectionObserver(
            (items) => {
                items.forEach((item) => {
                    const currentObserver = {
                        isIntersecting: item.isIntersecting,
                        y: item.boundingClientRect.y,
                        ratio: item.intersectionRatio,
                        index: itemsIds.indexOf(item.target.id)
                    }

                    if (currentObserver.isIntersecting) {
                        setActiveHash(item.target.id)
                    } else if (currentObserver.y > previousObserver.y) {
                        //Scrolling Up
                        if (
                            currentObserver.ratio < previousObserver.ratio &&
                            !currentObserver.isIntersecting
                        ) {
                            const indexDifference = previousObserver.index - currentObserver.index

                            if (indexDifference === 0 || indexDifference === 1) {
                                setActiveHash(itemsIds[currentObserver.index - 1])
                            }
                        }
                    }

                    previousObserver.y = currentObserver.y
                    previousObserver.ratio = currentObserver.ratio
                    previousObserver.index = currentObserver.index
                })
            },
            {rootMargin: `0% 0% -90% 0%`}
        )

        items.forEach((item) => {
            observer.observe(document.getElementById(item.id))
        })

        return () => {
            items.forEach((item) => {
                observer.unobserve(document.getElementById(item.id))
            })
        }
    }, [])

    return (
        <RightSidebarWrapper>
            <RightSidebarNav>
                <RightSidebarTitle>On this page</RightSidebarTitle>
                <RightSidebarList>
                    {listItems.map((item) => (
                        <RightSidebarListItem
                            key={location.pathname + item.url}
                            level={item.level}
                            hasHigherHeadings={item.hasHigherHeadings}
                        >
                            <ListItem
                                location={location}
                                item={item}
                                className={item.id === activeHash ? 'is-active' : ''}
                            />
                        </RightSidebarListItem>
                    ))}
                </RightSidebarList>
            </RightSidebarNav>
        </RightSidebarWrapper>
    )
}

const RightSidebarWrapper = styled.aside`
    display: none;
    flex: 1 0 ${(p) => p.theme.sidebarWidth};
    font-size: ${(p) => p.theme.fontSizes.md};
    font-weight: ${(p) => p.theme.fontWeights.light};
    ${mediaqueries.desktop_large_up`
    display: block;
  `};
`

const RightSidebarNav = styled.nav`
    position: sticky;
    top: var(--top-spacing-right-sidebar);
    height: 70vh;
    overflow: auto;
    width: ${(p) => p.theme.sidebarWidth};
    padding: 0 ${(p) => p.theme.space.md};
`

const RightSidebarTitle = styled.p`
    margin-top: 0;
    font-size: ${(p) => p.theme.fontSizes.sm};
    font-weight: ${(p) => p.theme.fontWeights.bolder};
    color: ${(p) => p.theme.colors.gray};
    text-transform: uppercase;
    margin-bottom: ${(p) => p.theme.space.sm};
`

const RightSidebarList = styled.ul`
    margin: 0;
    padding: 0;
    list-style: none;
    & ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }
`

const RightSidebarListItem = styled.li`
    margin-bottom: ${(p) => p.theme.space.sm};
    padding-left: ${(p) => (p.level <= 3 ? 0 : p.hasHigherHeadings ? p.theme.space.md : 0)};
    & a {
        -webkit-font-smoothing: antialiased;
    }
`

RightSidebar.propTypes = {
    isJsdocPage: PropTypes.bool,
    location: PropTypes.object.isRequired
}

export default RightSidebar
