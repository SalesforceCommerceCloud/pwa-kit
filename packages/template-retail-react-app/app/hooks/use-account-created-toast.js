/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    Box,
    Button,
    useDisclosure,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import CreatePasskeyModal from '@salesforce/retail-react-app/app/components/create-passkey-modal'

/**
 * Custom hook to show account creation success toast with passkey promotion
 * @returns {Object} Object containing showToast function and PasskeyModal component
 */
export const useAccountCreatedToast = () => {
    const toast = useToast()
    const passkeyModal = useDisclosure()

    const showToast = () => {
        toast({
            position: 'top-right',
            duration: 9000,
            isClosable: true,
            render: () => (
                <Box
                    color="white"
                    p={4}
                    bg="green.500"
                    borderRadius="md"
                    boxShadow="lg"
                    maxWidth="400px"
                >
                    <Box mb={3} fontWeight="medium">
                        Account successfully created! Create a passkey for more secure and easier
                        login next time
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

    const PasskeyModal = () => (
        <CreatePasskeyModal isOpen={passkeyModal.isOpen} onClose={passkeyModal.onClose} />
    )

    return {
        showToast,
        PasskeyModal
    }
}
