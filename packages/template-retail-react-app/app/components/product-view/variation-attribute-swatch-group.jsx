/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useIntl} from 'react-intl'
import {useHistory} from 'react-router-dom'
import PropTypes from 'prop-types'

import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'

const VariationAttributeSwatchGroup = ({id, name, selectedValue, values = [], variant}) => {
    const intl = useIntl()
    const history = useHistory()
    const swatches = values.map(({href, name, image, value, orderable}, index) => {
        const prev = values[(index || values.length) - 1] // modulo but supporting negatives
        const next = values[(index + 1) % values.length]

        /** Mimic the behavior of native radio inputs by using arrow keys to select prev/next value. */
        const onKeyDown = (evt) => {
            let sibling
            switch (evt.key) {
                case 'ArrowUp':
                case 'ArrowLeft':
                    evt.preventDefault()
                    sibling =
                        evt.target.previousElementSibling ||
                        evt.target.parentElement.lastElementChild
                    history.replace(prev.href)
                    break
                case 'ArrowDown':
                case 'ArrowRight':
                    evt.preventDefault()
                    sibling =
                        evt.target.nextElementSibling || evt.target.parentElement.firstElementChild
                    history.replace(next.href)
                    break
                default:
                    break
            }
            sibling?.focus()
        }
        const content = image ? (
            <Box
                height="100%"
                width="100%"
                minWidth="32px"
                backgroundRepeat="no-repeat"
                backgroundSize="cover"
                backgroundColor={name.toLowerCase()}
                backgroundImage={`url(${image.disBaseLink || image.link})`}
            />
        ) : (
            name
        )
        return (
            <Swatch
                key={value}
                href={href}
                disabled={!orderable}
                value={value}
                name={name}
                variant={variant}
                selected={selectedValue?.value === value}
                onKeyDown={onKeyDown}
            >
                {content}
            </Swatch>
        )
    })
    return (
        <SwatchGroup
            key={id}
            value={selectedValue?.value}
            displayName={selectedValue?.name || ''}
            label={intl.formatMessage(
                {
                    defaultMessage: '{variantType}',
                    id: 'product_view.label.variant_type'
                },
                {variantType: name}
            )}
        >
            {swatches}
        </SwatchGroup>
    )
}

/** @see `useVariationAttributes` hook for details. */
VariationAttributeSwatchGroup.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    selectedValue: PropTypes.object,
    values: PropTypes.array,
    variant: PropTypes.oneOf(['circle', 'square'])
}

export default VariationAttributeSwatchGroup
