/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useIntl} from 'react-intl'
import useToast from './use-toast'
import {API_ERROR_MESSAGE} from '../constants'

/**
 * Custom hook for error handling
 * @returns {Function} showError function
 */
export const useErrorHandler = () => {
    const {formatMessage} = useIntl()
    const toast = useToast()

    const showError = () => {
        toast({
            title: formatMessage(API_ERROR_MESSAGE),
            type: 'error'
        })
    }

    return showError
}
