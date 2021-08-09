import {useEffect, useState} from 'react'
import {useForm} from 'react-hook-form'
import {useCheckout} from '../util/checkout-context'

/**
 * A hook for managing and coordinating the billing address and payment method forms.
 * @returns {Object}
 */
const usePaymentForms = () => {
    const {
        selectedPayment,
        selectedBillingAddress,
        selectedShippingAddress,
        setPayment,
        setBillingAddress,
        isBillingSameAsShipping,
        goToNextStep
    } = useCheckout()

    // This local state value manages the 'checked' state of the billing address form's
    // checkbox for `Same as shipping address`. We initialize its value by checking if the
    // currently applied billing address matches the currently applied shipping address.
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(isBillingSameAsShipping)

    const paymentMethodForm = useForm()

    const billingAddressForm = useForm({
        shouldUnregister: false,
        defaultValues: {...selectedBillingAddress}
    })

    // This effect watches for changes to our basket's shipping/billing address. If they
    // are applied to the basket and they match, we update our local state value for the
    // `Same as shipping address` checkbox. This is necessary because when we initialized
    // `billingSameAsShipping` in `useState`, we may not have had the basket data yet, so
    // this ensures its properly set and in sync with our basket's state.
    useEffect(() => {
        if (!billingSameAsShipping && isBillingSameAsShipping) {
            setBillingSameAsShipping(true)
        }
    }, [isBillingSameAsShipping])

    const submitPaymentMethodForm = async (payment) => {
        // Make sure we only apply the payment if there isnt already one applied.
        // This works because a payment cannot be edited, only removed. In the UI,
        // we ensure that the any applied payment is removed before showing the
        // the payment form.
        if (!selectedPayment) {
            await setPayment(payment)
        }

        // Once the payment is applied to the basket, we submit the billing address.
        return billingAddressForm.handleSubmit(submitBillingAddressForm)()
    }

    const submitBillingAddressForm = async (address) => {
        // When the `Same as shipping address` checkbox is unchecked, we submit the form
        // values to be applied to the basket billing address. Note that we first remove
        // the field `addressId` if it was there before setting. This handles the case
        // where a registered user has selected one of their saved addresses to use as
        // the billing address, which will have an `addressId`. This needs to be omitted
        // from the API request as it is not part of the expected data.

        // When the checkbox is checked, we instead apply the current shipping address
        // to the billing address. Similar to the previous condition, we need to omit
        // the `id` field from the shipping address before sending the request.

        if (!billingSameAsShipping) {
            // eslint-disable-next-line no-unused-vars
            const {addressId, ...billingAddress} = address
            await setBillingAddress(billingAddress)
        } else {
            // eslint-disable-next-line no-unused-vars
            const {id, ...shippingAddress} = selectedShippingAddress
            await setBillingAddress(shippingAddress)
        }

        // Once the billing address is applied to the basket, we can move to the final
        // step in the process, which lets the customer review all checkout info.
        goToNextStep()
    }

    // We need to submit the payment form and billing address form one at a time,
    // but from a single control/button. So we kick off the payment submit first
    // and let that function take over the next step.
    // ------
    // TODO: Figure out how to run the form validations simultaneuously before
    // submitting the forms, so one doesn't need to wait on the other to check for
    // client-side validation errors.
    const reviewOrder = () => {
        return paymentMethodForm.handleSubmit(submitPaymentMethodForm)()
    }

    return {
        paymentMethodForm,
        billingAddressForm,
        billingSameAsShipping,
        setBillingSameAsShipping,
        reviewOrder
    }
}

export default usePaymentForms
