/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This page is here along witht the `callback` route to handle the redirect
// after a user logs in using the SLAS Implementation

<<<<<<< HEAD
import React, {Fragment} from 'react'
=======
import React, {useState, useEffect, Fragment} from 'react'
import {Input, Stack, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage, useIntl} from 'react-intl'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useLocation} from 'react-router-dom'
import usePasswordlessSignInCallback from '@salesforce/retail-react-app/app/hooks/use-passwordless-signin-callback'
>>>>>>> 6d0ac540a (use passwordlessaccesstoken in sdk)

const PwdlessRedirect = () => {
    const navigate = useNavigation()
    const location = useLocation()
    const {data: customer} = useCurrentCustomer()
    const {formatMessage} = useIntl()
    const [token, setToken] = useState('')

    const handleInputChange = (event) => {
        setToken(event.target.value)
    }

    const {handleButtonClick, authenticationError} = usePasswordlessSignInCallback({
        token,
        labels: {
            missingParameters: formatMessage({
                defaultMessage: 'Missing parameters',
                id: 'idp.redirect.error.missing_parameters'
            })
        }
    })

    useEffect(() => {
        if (customer?.isRegistered) {
            if (location?.state?.directedFrom) {
                navigate(location.state.directedFrom)
            } else {
                navigate('/account')
            }
        }
    }, [customer?.isRegistered])

    return (
        <Fragment>
            <Stack>
                <h1 data-testid="pwdless-redirect-page-heading">Passwordless Redirect</h1>
                <h1>We just sent a login token to email@email.com</h1>
                <Input placeholder="Input token here" value={token} onChange={handleInputChange} />
                <Button onClick={handleButtonClick}>
                    <FormattedMessage
                        defaultMessage="Log In"
                        id="passwordless_form.button.log_in"
                    />
                </Button>
                {authenticationError && <p>{authenticationError}</p>}
            </Stack>
        </Fragment>
    )
}

PwdlessRedirect.getTemplateName = () => 'pwdless-redirect'

export default PwdlessRedirect
