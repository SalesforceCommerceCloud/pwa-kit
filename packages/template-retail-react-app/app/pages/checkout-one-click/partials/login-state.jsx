/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login'

const LoginState = ({form, isSocialEnabled, idps}) => {
    if (isSocialEnabled) {
        return (
            <>
                <Text align="center" fontSize="sm" marginTop={2} marginBottom={2}>
                    <FormattedMessage
                        defaultMessage="Or Login With"
                        id="contact_info.message.or_login_with"
                    />
                </Text>

                {/* Social Login */}
                {idps && <SocialLogin form={form} idps={idps} />}
            </>
        )
    }
}

LoginState.propTypes = {
    form: PropTypes.object,
    isSocialEnabled: PropTypes.bool,
    idps: PropTypes.arrayOf(PropTypes.string)
}

export default LoginState
