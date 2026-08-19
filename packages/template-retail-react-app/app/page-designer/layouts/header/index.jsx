/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Region} from '@salesforce/commerce-sdk-react/page-designer'

/**
 * Embedded Header component.
 *
 * A singleton Page Designer component (instance id `header`) whose sole purpose is to
 * expose an `announcement` region above the storefront header. It holds no chrome of its
 * own — the storefront's own `Header`/`AboveHeader` remain the visual header. Authors place
 * content blocks (e.g. Announcement Banner) into the `announcement` region.
 */
export const Header = ({component}) => {
    return <Region component={component} regionId="announcement" />
}

Header.propTypes = {
    component: PropTypes.object.isRequired
}

Header.displayName = 'PageDesignerHeader'

export default Header
