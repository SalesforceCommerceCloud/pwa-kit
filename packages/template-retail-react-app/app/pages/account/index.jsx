/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'

import {getLayout} from '../../layouts/account'

const Account = () => {}

Account.getLayout = getLayout

Account.getTemplateName = () => 'account'

Account.propTypes = {
    match: PropTypes.object
}

export default Account
