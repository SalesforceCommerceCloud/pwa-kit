/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    Box,
    Button,
    CloseButton,
    useDisclosure,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * Custom hook to manage passkey registration prompt (toast and modal)
 * @returns {Object} Object containing showToast function and passkey modal state
 */
export const usePasskeyRegistration = () => {
    const toast = useToast()
    const passkeyModal = useDisclosure()

    const showToast = () => {
        toast({
            position: 'top-right',
            duration: 9000,
            isClosable: true,
            render: ({onClose}) => (
                <Box
                    color="white"
                    p={4}
                    bg="green.500"
                    borderRadius="md"
                    boxShadow="lg"
                    maxWidth="400px"
                    position="relative"
                >
                    <CloseButton
                        position="absolute"
                        right={2}
                        top={2}
                        color="white"
                        onClick={onClose}
                        aria-label="Close toast"
                    />
                    <Box mb={3} fontWeight="medium">
                        Create a passkey for a more secure and easier login
                    </Box>
                    <Button
                        size="sm"
                        colorScheme="whiteAlpha"
                        onClick={() => {
                            toast.closeAll()
                            passkeyModal.onOpen()
                        }}
                    >
                        Create Passkey
                    </Button>
                </Box>
            )
        })
    }

    return {
        showToast,
        passkeyModal: {
            isOpen: passkeyModal.isOpen,
            onClose: passkeyModal.onClose
        }
    }
}
