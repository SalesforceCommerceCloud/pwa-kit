/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Link as RouteLink} from 'react-router-dom'
import {useIntl} from 'react-intl'

// Components
import {
    Breadcrumb as ChakraBreadcrumb,
    // Hooks
    useSlotRecipe
} from '@chakra-ui/react'

// Icons
import {ChevronRightIcon} from '../../components/icons'

// Others
import {categoryUrlBuilder} from '../../utils/url'

/**
 * A simplification of the Chakra `Breadcrumb` component for our project needs. Given
 * a list of categories, display a breadcrumb and it's items.
 */
const Breadcrumb = ({categories, ...rest}) => {
    const intl = useIntl()
    const recipe = useSlotRecipe({key: 'breadcrumb'})
    const styles = recipe()

    return (
        <ChakraBreadcrumb.Root
            className="sf-breadcrumb"
            css={styles.container}
            separator={<ChevronRightIcon css={styles.icon} aria-hidden="true" />}
            {...rest}
        >
            <ChakraBreadcrumb.List>
                {categories.map((category, index) => (
                    <Fragment key={category.id}>
                        <ChakraBreadcrumb.Item data-testid="sf-crumb-item">
                            <ChakraBreadcrumb.Link
                                as={RouteLink}
                                to={categoryUrlBuilder(category, intl.locale)}
                                css={styles.link}
                            >
                                {category.name}
                            </ChakraBreadcrumb.Link>
                        </ChakraBreadcrumb.Item>
                        {index < categories.length - 1 && <ChakraBreadcrumb.Separator />}
                    </Fragment>
                ))}
            </ChakraBreadcrumb.List>
        </ChakraBreadcrumb.Root>
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
