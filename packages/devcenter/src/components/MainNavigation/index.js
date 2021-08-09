import PropTypes from 'prop-types'
import React, {useContext, useEffect, useState} from 'react'
import {TabletOrSmaller, Desktop} from '../../hooks/useMedia'
import {graphql, useStaticQuery} from 'gatsby'
import mainNav from '../../../mainNavConst'
import {convert2DArrayToObj, extractUrls} from '../../utils/helpers'
import {GlobalDispatchContext, GlobalStateContext} from '../../context/GlobalContextProvider'
import {calculateTreeData} from '../../utils/helpers'
import {filterSidebarContent} from '../../utils/helpers'
import LeftSideBar from './LeftSideBar'
import MobileNavigation from './MobileNavigation'
/**
 * This File was inspired by https://github.com/hasura/gatsby-gitbook-starter
 */

const MainNavigation = ({navOpen, location, setNavOpen, showLeftSidebar}) => {
    const result = useStaticQuery(graphql`
        query {
            allSite {
                edges {
                    node {
                        siteMetadata {
                            externalLinks {
                                title
                                url
                            }
                            sidebarConfig {
                                forcedNavOrder
                            }
                        }
                    }
                }
            }
            allMdx(
                filter: {fileAbsolutePath: {regex: "/content/"}}
                sort: {fields: fields___slug}
            ) {
                edges {
                    node {
                        fields {
                            slug
                            title
                            collection
                            group
                        }
                    }
                }
            }
        }
    `)

    const {allSite, allMdx} = result
    const {sidebarConfig, externalLinks} = allSite.edges[0].node.siteMetadata
    const data = filterSidebarContent(allMdx, location.pathname)
    const activeSubPath =
        location.pathname &&
        location.pathname
            .split('/')
            .filter(Boolean)
            .find((name) => {
                return Object.values(mainNav).includes(name)
            })
    const forcedNavOrder = convert2DArrayToObj(sidebarConfig.forcedNavOrder)[activeSubPath] || []
    const [treeData] = useState(() => calculateTreeData(data, forcedNavOrder))

    const state = useContext(GlobalStateContext)
    const dispatch = useContext(GlobalDispatchContext)
    const toggle = (slug) => {
        dispatch({
            type: 'TOGGLE_NAV_COLLAPSED',
            group: slug
        })
    }
    useEffect(() => {
        const defaultOpenUrls = extractUrls(location.pathname)
        defaultOpenUrls.forEach((url) => {
            if (!state.isOpen.includes(url)) {
                toggle(url)
            }
        })
    }, [])

    return (
        <>
            <LeftSideBar
                location={location}
                treeData={treeData}
                setCollapsed={toggle}
                isOpen={state.isOpen}
                showLeftSidebar={showLeftSidebar}
            />
            <div>
                <TabletOrSmaller>
                    <MobileNavigation
                        allMdx={allMdx}
                        allSite={allSite}
                        mobileNavPath={state.mobileNavPath}
                        setNavOpen={setNavOpen}
                        setCollapsed={toggle}
                        dispatch={dispatch}
                        isOpen={state.isOpen}
                        navOpen={navOpen}
                    />
                </TabletOrSmaller>
            </div>
        </>
    )
}

MainNavigation.propTypes = {
    navOpen: PropTypes.bool,
    location: PropTypes.object
}
export default MainNavigation
