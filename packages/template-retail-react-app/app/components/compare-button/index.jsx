/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    IconButton,
    Button,
    Tooltip,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useComparison} from '@salesforce/retail-react-app/app/hooks'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

// Icons - we'll create a simple compare icon using existing UI components
const CompareIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M9 3H7c-1.1 0-2 .9-2 2v9h2V5h2V3zm4 6V7l-3 3 3 3v-2h4v2l3-3-3-3v2h-4zm2 8h2v-7h2v7c0 1.1-.9 2-2 2h-2v-2z"/>
    </svg>
)

/**
 * CompareButton component allows users to add/remove products from comparison.
 * Can be rendered as an icon button or regular button.
 */
const CompareButton = ({
    product,
    variant = 'icon',
    size = 'md',
    ...rest
}) => {
    const intl = useIntl()
    const toast = useToast()
    const {
        addToComparison,
        removeFromComparison,
        isInComparison,
        canCompare
    } = useComparison()
    
    const isComparing = isInComparison(product.productId)
    const styles = useMultiStyleConfig('CompareButton', {variant, size})
    
    // ProductTile is used by two components, RecommendedProducts and ProductList.
    // RecommendedProducts provides a localized product name as `name` and non-localized product
    // name as `productName`. ProductList provides a localized name as `productName` and does not
    // use the `name` property.
    const localizedProductName = product.name ?? product.productName

    const handleClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        try {
            if (isComparing) {
                removeFromComparison(product.productId)
                toast({
                    title: intl.formatMessage(
                        {
                            id: 'compare_button.removed_from_comparison',
                            defaultMessage: '{product} removed from comparison'
                        },
                        {product: localizedProductName}
                    ),
                    status: 'info',
                    duration: 2000
                })
            } else {
                if (!canCompare) {
                    toast({
                        title: intl.formatMessage({
                            id: 'compare_button.max_products_reached',
                            defaultMessage: 'Maximum 4 products can be compared at once'
                        }),
                        status: 'warning',
                        duration: 3000
                    })
                    return
                }
                
                addToComparison(product)
                toast({
                    title: intl.formatMessage(
                        {
                            id: 'compare_button.added_to_comparison',
                            defaultMessage: '{product} added to comparison'
                        },
                        {product: localizedProductName}
                    ),
                    status: 'success',
                    duration: 2000
                })
            }
        } catch (error) {
            toast({
                title: intl.formatMessage({
                    id: 'compare_button.error',
                    defaultMessage: 'Unable to update comparison'
                }),
                description: error.message,
                status: 'error',
                duration: 3000
            })
        }
    }

    const ariaLabel = isComparing
        ? intl.formatMessage(
              {
                  id: 'compare_button.remove_from_comparison',
                  defaultMessage: 'Remove {product} from comparison'
              },
              {product: localizedProductName}
          )
        : intl.formatMessage(
              {
                  id: 'compare_button.add_to_comparison',
                  defaultMessage: 'Add {product} to comparison'
              },
              {product: localizedProductName}
          )

    const buttonText = isComparing
        ? intl.formatMessage({
              id: 'compare_button.comparing',
              defaultMessage: 'Comparing'
          })
        : intl.formatMessage({
              id: 'compare_button.compare',
              defaultMessage: 'Compare'
          })

    if (variant === 'icon') {
        return (
            <Tooltip
                label={ariaLabel}
                hasArrow
                placement="top"
            >
                <IconButton
                    aria-label={ariaLabel}
                    icon={<CompareIcon />}
                    onClick={handleClick}
                    colorScheme={isComparing ? 'blue' : 'gray'}
                    variant={isComparing ? 'solid' : 'ghost'}
                    size={size}
                    {...styles.container}
                    {...rest}
                />
            </Tooltip>
        )
    }

    return (
        <Button
            leftIcon={<CompareIcon />}
            onClick={handleClick}
            colorScheme={isComparing ? 'blue' : 'gray'}
            variant={isComparing ? 'solid' : 'outline'}
            size={size}
            {...styles.container}
            {...rest}
        >
            {buttonText}
        </Button>
    )
}

CompareButton.propTypes = {
    product: PropTypes.shape({
        productId: PropTypes.string.isRequired,
        name: PropTypes.string,
        productName: PropTypes.string
    }).isRequired,
    variant: PropTypes.oneOf(['icon', 'button']),
    size: PropTypes.oneOf(['sm', 'md', 'lg'])
}

export default CompareButton
