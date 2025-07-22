import React from 'react'
import {Box, Text, Button} from '@salesforce/retail-react-app/app/components/shared/ui'

const TestPage = () => {
    return (
        <Box layerStyle={'page'} p={4}>
            <Text fontSize="xl" fontWeight="bold" mb={4}>
                Page Designer Test Page
            </Text>
            <Text mb={4}>
                This is a test page to verify that the page viewer route is working correctly.
            </Text>
            <Button 
                onClick={() => window.location.href = '/page-viewer/test-page-id'}
                colorScheme="blue"
            >
                Test Page Viewer
            </Button>
        </Box>
    )
}

export default TestPage 