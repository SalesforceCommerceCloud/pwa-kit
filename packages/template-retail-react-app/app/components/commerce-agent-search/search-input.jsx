/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useLocation} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'
import {Button, InputRightElement} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import Search from '@salesforce/retail-react-app/app/components/search'
import {
    askAiButton,
    smartSearchColors
} from '@salesforce/retail-react-app/app/components/commerce-agent-search/styles'

const SmartSearchInput = (props) => {
    const {pathname, search} = useLocation()
    return (
        <Search
            key={pathname + search}
            defaultValue={new URLSearchParams(search).get('q') || ''}
            variant="outline"
            bg="white"
            color={smartSearchColors.ink}
            borderColor={smartSearchColors.border}
            _placeholder={{color: smartSearchColors.muted}}
            focusBorderColor={smartSearchColors.accent}
            borderRadius="12px"
            pr="112px"
            submitButton={
                <InputRightElement height="full" width="auto" pr={2}>
                    <Button
                        type="submit"
                        size="sm"
                        {...askAiButton}
                        leftIcon={<SparkleIcon boxSize={4} />}
                    >
                        <FormattedMessage defaultMessage="Ask AI" id="search.action.ask_ai" />
                    </Button>
                </InputRightElement>
            }
            {...props}
        />
    )
}

export default SmartSearchInput
