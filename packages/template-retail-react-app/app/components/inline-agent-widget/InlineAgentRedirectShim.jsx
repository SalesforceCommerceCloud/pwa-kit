/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    Box,
    Button,
    HStack,
    Input,
    InputGroup,
    InputRightElement,
    Text,
    Wrap,
    WrapItem
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {SparkleIcon} from '@salesforce/retail-react-app/app/components/icons'
import {handoffToShopperAgent} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

const InlineAgentRedirectShim = ({pdpQuestions = [], productName, productId}) => {
    const intl = useIntl()
    const [value, setValue] = useState('')

    const context = {productId, productName, pdpUrl: typeof window !== 'undefined' ? window.location.href : ''}

    const handleSubmit = (question) => {
        const q = (question ?? value).trim()
        if (!q) return
        handoffToShopperAgent({question: q, productContext: context})
        setValue('')
    }

    const placeholder = productName
        ? intl.formatMessage(
              {
                  id: 'inline_agent_widget.redirect.input_placeholder_with_product',
                  defaultMessage: 'Ask me anything about {productName}'
              },
              {productName}
          )
        : intl.formatMessage({
              id: 'inline_agent_widget.redirect.input_placeholder',
              defaultMessage: 'Ask me anything'
          })

    return (
        <Box
            data-testid="inline-agent-redirect-shim"
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="white"
        >
            <HStack spacing={2} mb={pdpQuestions.length > 0 ? 3 : 0} align="center">
                <SparkleIcon boxSize={4} />
                <Text fontSize="sm" fontWeight="semibold">
                    {intl.formatMessage({
                        id: 'inline_agent_widget.redirect.title',
                        defaultMessage: 'Have a question?'
                    })}
                </Text>
            </HStack>

            {pdpQuestions.length > 0 && (
                <Wrap spacing={2} mb={3} data-testid="inline-agent-redirect-pills">
                    {pdpQuestions.map((q) => (
                        <WrapItem key={q}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderRadius="full"
                                onClick={() => handleSubmit(q)}
                            >
                                {q}
                            </Button>
                        </WrapItem>
                    ))}
                </Wrap>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmit()
                }}
            >
                <InputGroup>
                    <Input
                        aria-label={placeholder}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        pr="4.5rem"
                    />
                    <InputRightElement width="4.5rem">
                        <Button
                            type="submit"
                            size="sm"
                            colorScheme="blue"
                            isDisabled={value.trim() === ''}
                        >
                            {intl.formatMessage({
                                id: 'inline_agent_widget.redirect.submit',
                                defaultMessage: 'Ask'
                            })}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </form>
        </Box>
    )
}

InlineAgentRedirectShim.propTypes = {
    pdpQuestions: PropTypes.arrayOf(PropTypes.string),
    productName: PropTypes.string,
    productId: PropTypes.string
}

export default InlineAgentRedirectShim
