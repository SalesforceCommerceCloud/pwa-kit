/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Link as RouteLink, useHistory} from 'react-router-dom'

// Components
import {
    Button,
    Flex,
    Select,
    Text,

    // Hooks
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Icons
import {ChevronLeftIcon, ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'

// Constants
const SELECT_ID = 'pagination'

/**
 * The pagination component is a simple component allowing you to navigate
 * from one page  to the next by means of previous or next buttons, or directly
 * using a select drop down.
 */
const Pagination = (props) => {
    const intl = useIntl()
    const styles = useStyleConfig('Pagination')
    const history = useHistory()
    const {urls, currentURL, ...rest} = props

    const currentIndex = urls.indexOf(currentURL) > 0 ? urls.indexOf(currentURL) : 0
    const prev = urls[currentIndex - 1]
    const next = urls[currentIndex + 1]

    // Determine the current page index.
    return (
        <Flex data-testid="sf-pagination" className="sf-pagination" {...styles.container} {...rest}>
            {/* Previous Button */}
            <Button
                {...styles.button}
                as={RouteLink}
                // Because we are using a button component as a link, the isDisabled flag isn't working
                // as intended, the workaround is to use the current url when its disabled.
                href={prev || currentURL}
                to={prev || currentURL}
                aria-label="Previous Page"
                isDisabled={!prev}
                variant="link"
            >
                <ChevronLeftIcon />
                <Text>
                    {intl.formatMessage({
                        id: 'pagination.link.prev',
                        defaultMessage: 'Prev'
                    })}
                </Text>
            </Button>

            {/* Direct Page Selection */}
            <Flex paddingLeft={4} paddingRight={4}>
                <Select
                    id={SELECT_ID}
                    onChange={(e) => {
                        history.push(e.target.value)
                    }}
                    value={currentURL}
                    height={11}
                >
                    {urls.map((href, index) => (
                        <option key={index} value={href}>
                            {index + 1}
                        </option>
                    ))}
                </Select>

                <Text {...styles.text}>
                    {intl.formatMessage(
                        {
                            id: 'pagination.field.num_of_pages',
                            defaultMessage: 'of {numOfPages}'
                        },
                        {numOfPages: urls.length}
                    )}
                </Text>
            </Flex>

            {/* Next Button */}
            <Button
                {...styles.button}
                as={RouteLink}
                // Because we are using a button component as a link, the isDisabled flag isn't working
                // as intended, the workaround is to use the current url when its disabled.
                href={next || currentURL}
                to={next || currentURL}
                aria-label="Next Page"
                isDisabled={!next}
                variant="link"
            >
                <Text>
                    {intl.formatMessage({
                        id: 'pagination.link.next',
                        defaultMessage: 'Next'
                    })}
                </Text>
                <ChevronRightIcon />
            </Button>
        </Flex>
    )
}

Pagination.displayName = 'Pagination'

Pagination.propTypes = {
    /**
     * A list of URL's representing the pages that can be navigated to.
     */
    urls: PropTypes.array.isRequired,
    /**
     * The URL representing the current page
     */
    currentURL: PropTypes.string
}

export default Pagination
