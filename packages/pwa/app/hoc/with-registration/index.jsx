import React from 'react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {AuthModal, useAuthModal} from '../../hooks/use-auth-modal'
import PropTypes from 'prop-types'
import {noop} from '../../utils/utils'

const withRegistration = (Component) => {
    const WrappedComponent = ({onClick = noop, ...passThroughProps}) => {
        const customer = useCustomer()
        const authModal = useAuthModal()

        const handleClick = () => {
            if (customer?.authType !== 'registered') {
                authModal.onOpen()
            } else {
                onClick()
            }
        }

        return (
            <React.Fragment>
                <Component {...passThroughProps} onClick={handleClick} />
                <AuthModal {...authModal} onLoginSuccess={onClick} />
            </React.Fragment>
        )
    }
    WrappedComponent.propTypes = {
        onClick: PropTypes.func
    }
    return WrappedComponent
}

export default withRegistration
