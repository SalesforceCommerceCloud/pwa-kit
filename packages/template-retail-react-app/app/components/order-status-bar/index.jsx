/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useTheme} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import StatusBar from '@salesforce/retail-react-app/app/components/order-status-bar/status-bar'

const steps = ['Ordered', 'Dispatched', 'Out for delivery', 'Delivered']

const OrderStatusBar = ({currentStepLabel}) => {
    const theme = useTheme()
    const intl = useIntl()

    const getLocalizedMessage = (status) => {
        switch (status) {
            case 'Ordered':
                return intl.formatMessage({id: 'status_bar.ordered', defaultMessage: 'Ordered'})
            case 'Dispatched':
                return intl.formatMessage({
                    id: 'status_bar.dispatched',
                    defaultMessage: 'Dispatched'
                })
            case 'Out for delivery':
                return intl.formatMessage({
                    id: 'status_bar.out_for_delivery',
                    defaultMessage: 'Out for delivery'
                })
            case 'Delivered':
                return intl.formatMessage({id: 'status_bar.delivered', defaultMessage: 'Delivered'})
            default:
                return status
        }
    }

    // Convert steps to the format expected by StatusBar component
    const statusBarSteps = steps.map((step) => ({
        label: getLocalizedMessage(step),
        status: step,
        description: `Order status: ${getLocalizedMessage(step)}`
    }))

    // Find current step index
    let currentStep = steps.findIndex((step) => step === currentStepLabel)
    if (currentStep === -1) currentStep = 0

    // Define colors using theme
    const colors = {
        completed: theme.colors.teal[100], // completed steps
        current: theme.colors.blue[900], // current step
        future: theme.colors.gray[200], // future steps
        completedText: theme.colors.black[600], // completed steps text
        currentText: 'white', // current step text
        futureText: theme.colors.black[600] // future steps text
    }

    return (
        <StatusBar
            steps={statusBarSteps}
            currentStep={currentStep}
            colors={colors}
            ariaLabel="Order Status Steps"
            width={1080}
            height={50}
            chevronWidth={24}
            radius={25}
        />
    )
}

OrderStatusBar.propTypes = {
    currentStepLabel: PropTypes.string
}

export default OrderStatusBar
