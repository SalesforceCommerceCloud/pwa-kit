/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'

import {
    Box,
    IconButton,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import {HeartIcon, HeartSolidIcon} from '@salesforce/retail-react-app/app/components/icons'
import {useIntl} from 'react-intl'

const IconButtonWithRegistration = withRegistration(IconButton)

// TODO: allows for custom heart icons
const FavouriteButton = ({isFavourite, onFavouriteToggle, ...rest}) => {
    const intl = useIntl()
    const [isFavouriteLoading, setFavouriteLoading] = useState(false)
    const styles = useMultiStyleConfig('ProductTile')

    return (
        <Box
            onClick={(e) => {
                // stop click event from bubbling
                // to avoid user from clicking the underlying
                // product while the favourite icon is disabled
                e.preventDefault()
            }}
            {...rest}
        >
            <IconButtonWithRegistration
                aria-label={intl.formatMessage({
                    id: 'product_tile.assistive_msg.wishlist',
                    defaultMessage: 'Wishlist'
                })}
                icon={isFavourite ? <HeartSolidIcon /> : <HeartIcon />}
                {...styles.favIcon}
                disabled={isFavouriteLoading}
                onClick={async () => {
                    setFavouriteLoading(true)
                    await onFavouriteToggle(!isFavourite)
                    setFavouriteLoading(false)
                }}
            />
        </Box>
    )
}

FavouriteButton.propTypes = {
    /**
     * Display the product as a faviourite.
     */
    isFavourite: PropTypes.bool,
    /**
     * Callback function to be invoked when the user
     * interacts with favourite icon/button.
     */
    onFavouriteToggle: PropTypes.func
}

export default FavouriteButton
