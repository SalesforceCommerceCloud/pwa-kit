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

const StoreInventoryFilter = () => {
    const [isChecked, setIsChecked] = React.useState(false)
    const [selectedStore, setSelectedStore] = React.useState(null)
    const {isOpen, onOpen, onClose} = useDisclosure()
    const {site} = useMultiSite()

    useEffect(() => {
        const checkSelectedStore = () => {
            const storeInfoKey = `store_${site.id}`
            const storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey))
            
            if (storeInfo?.name) {
                setSelectedStore(storeInfo)
            } else {
                setSelectedStore(null)
                setIsChecked(false)
            }
        }

        checkSelectedStore()
    }, [site.id, isOpen])

    const handleCheckboxChange = (e) => {
        const checked = e.target.checked
        setIsChecked(checked)
    }

    const handleStoreNameClick = (e) => {
        e.stopPropagation() // Prevent checkbox from being triggered
        e.preventDefault()
        onOpen() // Always open store locator when store name text is clicked
    }

    const handleStoreLocatorClose = () => {
        const storeInfoKey = `store_${site.id}`
        const storeInfo = JSON.parse(window.localStorage.getItem(storeInfoKey))
        
        if (storeInfo?.name) {
            setSelectedStore(storeInfo)
            setIsChecked(true) // Auto-check when store is selected
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