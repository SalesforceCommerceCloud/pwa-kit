/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import Footer from '../../footer'
import CheckoutFooter from '../../../pages/checkout/partials/checkout-footer'

/**
 * AppFooter component that renders the appropriate footer based on checkout state
 * Handles conditional rendering of normal footer vs checkout footer
 */
const AppFooter = ({isCheckout}) => {
    return !isCheckout ? <Footer /> : <CheckoutFooter />
}

AppFooter.propTypes = {
    isCheckout: PropTypes.bool.isRequired
}

export default AppFooter
