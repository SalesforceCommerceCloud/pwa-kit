/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Link from '../link'

/**
 * `Breadcrumbs` is used to provide users a navigational path they took to get to the current page.
 *
 * @example ./DESIGN.md
 */

const Breadcrumbs = ({className, items, youAreHereMessage, includeMicroData}) => {
    if (!items.length) {
        return false
    }

    let breadcrumbListMicroData = {}
    let listMicroData = {}
    let thingMicroData = {}

    if (includeMicroData) {
        breadcrumbListMicroData = {
            itemScope: true,
            itemType: 'http://schema.org/BreadcrumbList'
        }
        listMicroData = {
            itemProp: 'itemListElement',
            itemScope: true,
            itemType: 'http://schema.org/ListItem'
        }
        thingMicroData = {
            itemScope: true,
            itemProp: 'item',
            itemType: 'http://schema.org/Thing'
        }
    }

    return (
        <nav role="navigation" className={classNames('pw-breadcrumbs', className)}>
            <p id="breadcrumb__label" className="pw-breadcrumbs__label u-visually-hidden">
                {youAreHereMessage}: {items[items.length - 1].text}
            </p>

            <ol
                aria-labelledby="breadcrumb__label"
                className="pw-breadcrumbs__list"
                {...breadcrumbListMicroData}
            >
                {items.map(({href, text, onClick}, index) => {
                    const itemContent = includeMicroData ? (
                        <span itemProp="name">
                            {text}
                            {href && <meta itemProp="url" content={href} />}
                        </span>
                    ) : (
                        text
                    )
                    return (
                        <li className="pw-breadcrumbs__item" key={index} {...listMicroData}>
                            {href || onClick ? (
                                <Link
                                    href={href}
                                    className="pw-breadcrumbs__link"
                                    onClick={onClick}
                                    {...thingMicroData}
                                >
                                    {itemContent}
                                </Link>
                            ) : (
                                <span className="pw-breadcrumbs__non-link" {...thingMicroData}>
                                    {itemContent}
                                </span>
                            )}
                            {includeMicroData && <meta itemProp="position" content={index + 1} />}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

Breadcrumbs.defaultProps = {
    items: [],
    youAreHereMessage: 'You are here'
}

Breadcrumbs.propTypes = {
    /**
     * The list of breadcrumbs.
     * Each breadcrumb item should be an object (More info on items prop below).
     */
    items: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).required,
            href: PropTypes.string,
            onClick: PropTypes.func
        })
    ).isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Indicates if SEO microdata should be included in the breadcrumb element
     * https://developers.google.com/search/docs/data-types/breadcrumbs
     * https://www.w3.org/TR/microdata/
     */
    includeMicroData: PropTypes.bool,

    /**
     * This component has a visually hidden label to make it more accessible to screen readers.
     * You can change this property to change the label's content.
     */
    youAreHereMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export default Breadcrumbs
