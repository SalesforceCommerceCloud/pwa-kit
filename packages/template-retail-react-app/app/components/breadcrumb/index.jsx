/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'
import {useIntl} from 'react-intl'

// Components
import {
    Breadcrumb as ChakraBreadcrumb,
    BreadcrumbItem as ChakraBreadcrumbItem,
    BreadcrumbLink as ChakraBreadcrumbLink,
    // Hooks
    useStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Icons
import {ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'

// Others
import {categoryUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

/**
 * A simplification of the Chakra `Breadcrumb` component for our project needs. Given
 * a list of categories, display a breadcrumb and it's items.
 */
const Breadcrumb = ({categories, ...rest}) => {
    const intl = useIntl()
    const styles = useStyleConfig('Breadcrumb')

    return (
        <ChakraBreadcrumb
            className="sf-breadcrumb"
            {...styles.container}
            separator={<ChevronRightIcon {...styles.icon} />}
            {...rest}
        >
            {categories.map((category) => (
                <ChakraBreadcrumbItem key={category.id} data-testid="sf-crumb-item">
                    <ChakraBreadcrumbLink
                        as={RouteLink}
                        to={categoryUrlBuilder(category, intl.locale)}
                        {...styles.link}
                    >
                        {category.name}
                    </ChakraBreadcrumbLink>
                </ChakraBreadcrumbItem>
            ))}
        </ChakraBreadcrumb>
    )
}

Breadcrumb.displayName = 'Breadcrumb'

Breadcrumb.propTypes = {
    /**
     * The categories to be displayed in this breadcrumb.
     */
    categories: PropTypes.array
}

export default Breadcrumb
