import React, {useEffect} from 'react'
import {
    Heading,
    Checkbox,
    Stack,
    Text,
    useDisclosure
} from '@salesforce/retail-react-app/app/components/shared/ui'
import StoreLocatorModal from '@salesforce/retail-react-app/app/components/store-locator-modal'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

const StoreInventoryFilter = ({ toggleFilter, selectedFilters }) => {
    // const [isChecked, setIsChecked] = selectedFilters.ilids !== undefined
    const [selectedStore, setSelectedStore] = React.useState(null)
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {site} = useMultiSite()
     
    const isChecked = selectedFilters.ilids !== undefined

    useEffect(() => {
        const storeInfoKey = `store_${site.id}`
        const storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey) || 'null')
        
        if (storeInfo?.name && storeInfo?.inventoryId) {
            setSelectedStore(storeInfo)
        }
    }, [site.id])


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
        const storeInfoKey = `store_${site.id}`
        const storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey))
        
        // Only proceed if both name AND inventoryId exist
        if (storeInfo?.name && storeInfo?.inventoryId) {
            setSelectedStore(storeInfo)
            toggleFilter(
                { value: storeInfo.inventoryId }, 
                'ilids', 
                false,
                false
            )
        }
        
        onClose()
    }

    return (
        <>
            <Stack spacing={4} paddingTop={0} paddingBottom={6} borderBottom="1px solid gray.200">
                <Heading
                    as="h2"
                    fontSize="md"
                    fontWeight={600}
                >
                    Shop by Availability
                </Heading>
                <Checkbox
                    isChecked={isChecked}
                    onChange={handleCheckboxChange}
                >
                    In stock at <Text 
                        as="span" 
                        textDecoration="underline"
                        cursor="pointer"
                        onClick={handleStoreNameClick}
                        _hover={{ color: 'blue.500' }}
                    >
                        {selectedStore?.name || 'Select Store'}
                    </Text>
                </Checkbox>
            </Stack>
            
            <StoreLocatorModal isOpen={isOpen} onClose={handleStoreLocatorClose} />
        </>
    )
}

export default StoreInventoryFilter