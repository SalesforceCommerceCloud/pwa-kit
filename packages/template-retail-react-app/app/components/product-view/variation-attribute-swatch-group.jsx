/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui/index'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

const VariationAttributeSwatchGroup = ({id, name, selectedValue, values = [], variant}) => {
    const intl = useIntl()
    const swatches = values.map(({href, name, image, value, orderable}) => {
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
