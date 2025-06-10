import React, {useEffect, useState} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import {
    Heading,
    Checkbox,
    Stack,
    Text,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoreLocatorModal from '@salesforce/retail-react-app/app/components/store-locator-modal'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {getSelectedStoreData} from '@salesforce/retail-react-app/app/utils/store-locator-utils'

const StoreInventoryFilter = ({ toggleFilter, selectedFilters }) => {
    const [selectedStore, setSelectedStore] = useState(null)
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {site} = useMultiSite()
    const {formatMessage} = useIntl()

    const isChecked = selectedFilters?.ilids !== undefined

    useEffect(() => {
        const storeInfo = getSelectedStoreData(site?.id)
        
        if (storeInfo?.name && storeInfo?.inventoryId) {
            setSelectedStore(storeInfo)
        }
    }, [site?.id])

    const handleCheckboxChange = (e) => {
        // If no store is selected or no inventoryId, open store locator
        if (!selectedStore?.inventoryId) {
            e.preventDefault() // Prevent checkbox from being checked
            onOpen() // Open store locator
            return
        }
        
        // Normal checkbox behavior when store is selected
        const checked = e.target.checked
        toggleFilter(
            { value: selectedStore.inventoryId }, 
            'ilids', 
            !checked,
            false
        )
    }

    const handleStoreNameClick = (e) => {
        e.stopPropagation() // Prevent checkbox from being triggered
        e.preventDefault()
        onOpen() // Always open store locator when store name text is clicked
    }

    const handleStoreLocatorClose = () => {
        const storeInfo = getSelectedStoreData(site?.id)
        
        if (storeInfo?.name && storeInfo?.inventoryId) {
            setSelectedStore(storeInfo)

            // Apply the filter when a store is selected from the locator
            toggleFilter(
                { value: storeInfo.inventoryId }, 
                'ilids', 
                false,
                false
            )
        }
        
        onClose()
    }

    const storeLinkText = selectedStore?.name || formatMessage({
        defaultMessage: 'Select Store',
        id: 'store_inventory_filter.action.select_store'
    })

    return (
        <>
            <Stack 
                spacing={4} 
                paddingTop={0} 
                paddingBottom={6} 
                borderBottom="1px solid gray.200"
                data-testid="sf-store-inventory-filter"
            >
                <Heading
                    as="h2"
                    fontSize="md"
                    fontWeight={600}
                >
                    <FormattedMessage
                        defaultMessage="Shop by Availability"
                        id="store_inventory_filter.heading.shop_by_availability"
                    />
                </Heading>
                <Checkbox
                    isChecked={isChecked}
                    onChange={handleCheckboxChange}
                    aria-label={formatMessage({
                        defaultMessage: 'Filter products by store availability at {storeName}',
                        id: 'store_inventory_filter.checkbox.assistive_msg'
                    }, {
                        storeName: storeLinkText
                    })}
                >
                    <FormattedMessage
                        defaultMessage="In stock at {storeLink}"
                        id="store_inventory_filter.checkbox.label"
                        values={{
                            storeLink: (
                                <Text 
                                    as="span" 
                                    textDecoration="underline"
                                    cursor="pointer"
                                    onClick={handleStoreNameClick}
                                    _hover={{ color: 'blue.500' }}
                                    aria-label={formatMessage({
                                        defaultMessage: 'Open store locator to {action}',
                                        id: 'store_inventory_filter.link.assistive_msg'
                                    }, {
                                        action: selectedStore?.name 
                                            ? formatMessage({
                                                defaultMessage: 'change store',
                                                id: 'store_inventory_filter.action.change_store'
                                            })
                                            : formatMessage({
                                                defaultMessage: 'select a store',
                                                id: 'store_inventory_filter.action.select_store_link'
                                            })
                                    })}
                                >
                                    {storeLinkText}
                                </Text>
                            )
                        }}
                    />
                </Checkbox>
            </Stack>
            
            <StoreLocatorModal isOpen={isOpen} onClose={handleStoreLocatorClose} />
        </>
    )
}

export default StoreInventoryFilter