/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useCallback, useMemo} from 'react'
import {useForm} from 'react-hook-form'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {
    areAddressesEqual,
    sanitizedCustomerAddress
} from '@salesforce/retail-react-app/app/utils/address-utils'
import {nanoid} from 'nanoid'

export const useAddressForm = (
    addGuestAddress,
    isGuest,
    setAddressesForItems,
    availableAddresses,
    deliveryItems
) => {
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const {data: customer, refetch: refetchCustomer} = useCurrentCustomer()
    const [formStateByItemId, setFormStateByItemId] = useState({})

    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')

    const form = useForm({
        mode: 'onSubmit',
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            countryCode: 'US',
            address1: '',
            city: '',
            stateCode: '',
            postalCode: '',
            preferred: false
        }
    })

    const isAddressFormOpen = useMemo(() => {
        return Object.keys(formStateByItemId).filter((key) => formStateByItemId[key])?.length > 0
    }, [formStateByItemId])

    const handleCreateAddress = useCallback(
        async (addressData, itemId) => {
            try {
                const isDuplicate = availableAddresses.some((existingAddr) =>
                    areAddressesEqual(addressData, existingAddr)
                )

                if (isDuplicate) {
                    showToast({
                        title: formatMessage({
                            id: 'shipping_multi_address.error.duplicate_address',
                            defaultMessage: 'The address you entered already exists.'
                        }),
                        status: 'info'
                    })
                    setFormStateByItemId((prev) => ({...prev, [itemId]: false}))
                    form.reset()
                    form.clearErrors()
                    return null
                }

                let newAddress

                if (isGuest) {
                    newAddress = addGuestAddress(addressData)
                } else {
                    const apiAddressData = {
                        ...sanitizedCustomerAddress(addressData),
                        addressId: `addr_${nanoid()}`
                    }

                    const createdAddress = await createCustomerAddress.mutateAsync({
                        body: apiAddressData,
                        parameters: {customerId: customer.customerId}
                    })
                    await refetchCustomer()
                    newAddress = createdAddress
                }

                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.success.address_saved',
                        defaultMessage: 'Address saved successfully'
                    }),
                    status: 'success'
                })

                // Assign the address to items
                if (availableAddresses.length === 0) {
                    // If first address, apply it to all items
                    const itemIds = deliveryItems.map((item) => item.itemId)
                    setAddressesForItems(itemIds, newAddress.addressId)
                } else {
                    setAddressesForItems(itemId, newAddress.addressId)
                }

                setFormStateByItemId((prev) => ({...prev, [itemId]: false}))
                form.reset()
                form.clearErrors()

                return newAddress
            } catch (error) {
                showToast({
                    title: formatMessage({
                        id: 'shipping_multi_address.error.save_failed',
                        defaultMessage: "Couldn't save the address."
                    }),
                    status: 'error'
                })
            }
        },
        [
            isGuest,
            addGuestAddress,
            customer?.customerId,
            setAddressesForItems,
            availableAddresses,
            deliveryItems
        ]
    )

    const openForm = useCallback((itemId) => {
        setFormStateByItemId((prev) => ({...prev, [itemId]: true}))
    }, [])

    const closeForm = useCallback(
        (itemId) => {
            setFormStateByItemId((prev) => ({...prev, [itemId]: false}))
            form.clearErrors()
        },
        [form]
    )

    return {
        form,
        formStateByItemId,
        isSubmitting: form.formState.isSubmitting,
        openForm,
        closeForm,
        handleCreateAddress,
        isAddressFormOpen,
        formErrors: form.formState.errors
    }
}
