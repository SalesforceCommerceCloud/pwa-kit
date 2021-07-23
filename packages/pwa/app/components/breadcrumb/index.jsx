/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
} from '@chakra-ui/react'

// Icons
import {ChevronRightIcon} from '../icons'

// Others
import {categoryUrlBuilder} from '../../utils/url'

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
