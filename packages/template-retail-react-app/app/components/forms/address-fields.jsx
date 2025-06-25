/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import {defineMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {
    Grid,
    GridItem,
    SimpleGrid,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import useAddressFields from '@salesforce/retail-react-app/app/components/forms/useAddressFields'
import Field from '@salesforce/retail-react-app/app/components/field'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {MESSAGE_PROPTYPE} from '@salesforce/retail-react-app/app/utils/locale'
import {useMapsLibrary} from '@vis.gl/react-google-maps';

function useAutocompleteSuggestions(inputString = '', requestOptions = {}) {
    const placesLib = useMapsLibrary('places');
  
    // stores the current sessionToken
    const sessionTokenRef = useRef(null);
  
    // the suggestions based on the specified input
    const [suggestions, setSuggestions] = useState([]);
  
    // indicates if there is currently an incomplete request to the places API
    const [isLoading, setIsLoading] = useState(false);
  
    // once the PlacesLibrary is loaded and whenever the input changes, a query
    // is sent to the Autocomplete Data API.
    useEffect(() => {
        if (!placesLib) return;
    
        const {AutocompleteSessionToken, AutocompleteSuggestion} = placesLib;
    
        // Create a new session if one doesn't already exist. This has to be reset
        // after `fetchFields` for one of the returned places is called by calling
        // the `resetSession` function returned from this hook.
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = new AutocompleteSessionToken();
        }
    
        const request = {
            ...requestOptions,
            includedPrimaryTypes: ['street_address'],
            input: inputString,
            sessionToken: sessionTokenRef.current
        };
    
        if (inputString === '') {
            if (suggestions.length > 0) setSuggestions([]);
            return;
        }
    
        setIsLoading(true);
        AutocompleteSuggestion.fetchAutocompleteSuggestions(request).then(res => {
            setSuggestions(res.suggestions);
            setIsLoading(false);
        });
    }, [placesLib, inputString]);
  
    return {
        suggestions,
        isLoading,
        resetSession: () => {
            sessionTokenRef.current = null;
            setSuggestions([]);
        }
    };
}


const defaultFormTitleAriaLabel = defineMessage({
    defaultMessage: 'Address Form',
    id: 'use_address_fields.label.address_form'
})

const AddressFields = ({
    form,
    prefix = '',
    formTitleAriaLabel = defaultFormTitleAriaLabel,
    isBillingAddress = false
}) => {
    const {data: customer} = useCurrentCustomer()
    const fields = useAddressFields({form, prefix})
    const intl = useIntl()
    const addressFormRef = useRef()
    const [inputValue, setInputValue] = useState(form.getValues().address1);
    const {suggestions, resetSession, isLoading} = useAutocompleteSuggestions(inputValue);
    useEffect(() => {
        // Focus on the form when the component mounts for accessibility
        addressFormRef?.current?.focus()
    }, [])

    return (
        <Stack
            spacing={5}
            aria-label={intl.formatMessage(formTitleAriaLabel)}
            tabIndex="0"
            ref={addressFormRef}
        >
            <SimpleGrid columns={[1, 1, 2]} gap={5}>
                <Field {...fields.firstName} />
                <Field {...fields.lastName} />
            </SimpleGrid>
            <Field {...fields.phone} />
            <Field {...fields.countryCode} />
            {suggestions.length > 0 && (
                <div className="custom-list">
                {suggestions.map((suggestion, index) => {
                    return (
                    <p
                        key={index}
                        className="custom-list-item"
                        onClick={() => {
                            const place = suggestion.placePrediction.toPlace();
                            place.fetchFields({
                                fields: ["formattedAddress"],
                            }).then(() => console.log(place.formattedAddress))
                        }}>
                        {suggestion.placePrediction?.text.text}
                    </p>
                    );
                })}
                </div>
            )}
            <Field {...fields.address1}  
                    inputProps={({onChange}) => ({
                        ...fields.address1.inputProps,
                        onChange(evt) {
                            const value = evt.target.value;
                            setInputValue(value);
                            return onChange(value);
                        }
                    })}
                />
            <Field {...fields.city} />
            <Grid templateColumns="repeat(8, 1fr)" gap={5}>
                <GridItem colSpan={[4, 4, 4]}>
                    <Field {...fields.stateCode} />
                </GridItem>
                <GridItem colSpan={[4, 4, 4]}>
                    <Field {...fields.postalCode} />
                </GridItem>
            </Grid>
            {customer.isRegistered && !isBillingAddress && <Field {...fields.preferred} />}
        </Stack>
    )
}

AddressFields.propTypes = {
    /** Object returned from `useForm` */
    form: PropTypes.object.isRequired,

    /** Optional prefix for field names */
    prefix: PropTypes.string,

    /** Optional aria label to use for the address form */
    formTitleAriaLabel: MESSAGE_PROPTYPE,

    /** Optional flag to indication if an address is a billing address */
    isBillingAddress: PropTypes.bool
}

export default AddressFields
