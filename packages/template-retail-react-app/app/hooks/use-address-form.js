import {useState, useCallback, useMemo} from 'react'
import {useForm} from 'react-hook-form'
import {useToast} from './use-toast'
import {useIntl} from 'react-intl'
import {useShopperCustomersMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from './use-current-customer'
import {nanoid} from 'nanoid'

export const useAddressForm = (addGuestAddress, isGuest, setAddressesForItems, availableAddresses, deliveryItems) => {
    const {formatMessage} = useIntl()
    const showToast = useToast()
    const {data: customer, refetch: refetchCustomer} = useCurrentCustomer()
    const [showForm, setShowForm] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

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
        return Object.keys(showForm).filter((key) => showForm[key])?.length > 0
    }, [showForm])

    const handleCreateAddress = useCallback(async (addressData, itemId) => {
        setIsSubmitting(true)
        try {
            let newAddress

            if (isGuest) {
                // Handle guest address creation
                newAddress = addGuestAddress(addressData)
            } else {
                // Handle registered user address creation
                // Ensure required fields are present and properly formatted
                const apiAddressData = {
                    // Generate a unique addressId using nanoid for better uniqueness
                    addressId: `addr_${nanoid()}`,
                    // Keep original field names as the API expects them
                    firstName: addressData.firstName,
                    lastName: addressData.lastName,
                    phone: addressData.phone,
                    countryCode: addressData.countryCode,
                    address1: addressData.address1,
                    city: addressData.city,
                    stateCode: addressData.stateCode,
                    postalCode: addressData.postalCode,
                    // Add any other required fields
                    address2: addressData.address2 || '',
                    companyName: addressData.companyName || '',
                    preferred: addressData.preferred || false
                }
                
                const createdAddress = await createCustomerAddress.mutateAsync({
                    body: apiAddressData,
                    parameters: {customerId: customer.customerId}
                })
                await refetchCustomer()
                newAddress = createdAddress
            }

            // Success handling
            showToast({
                title: formatMessage({
                    id: 'shipping_multi_address.success.address_saved',
                    defaultMessage: 'Address saved successfully'
                }),
                status: 'success'
            })

            // Assign the address to items
            if (availableAddresses.length === 0) {
                // If this is the first address, apply it to all delivery items
                const itemIds = deliveryItems.map(item => item.itemId)
                setAddressesForItems(itemIds, newAddress.addressId)
            } else {
                // For subsequent addresses, only assign to the current item
                setAddressesForItems(itemId, newAddress.addressId)
            }

            setShowForm(prev => ({...prev, [itemId]: false}))
            form.reset()
            form.clearErrors()

            return newAddress
        } catch (error) {
            // Error handling
            showToast({
                title: formatMessage({
                    id: 'shipping_multi_address.error.save_failed',
                    defaultMessage: "Couldn't save the address."
                }),
                status: 'error'
            })
        } finally {
            setIsSubmitting(false)
        }
    }, [isGuest, addGuestAddress, createCustomerAddress, customer?.customerId, refetchCustomer, showToast, formatMessage, form, setAddressesForItems, availableAddresses, deliveryItems])

    const openForm = useCallback((itemId) => {
        setShowForm(prev => ({...prev, [itemId]: true}))
    }, [])

    const closeForm = useCallback((itemId) => {
        setShowForm(prev => ({...prev, [itemId]: false}))
        form.clearErrors()
    }, [form])

    return {
        form,
        showForm,
        isSubmitting,
        openForm,
        closeForm,
        handleCreateAddress,
        isAddressFormOpen,
        formErrors: form.formState.errors
    }
}
