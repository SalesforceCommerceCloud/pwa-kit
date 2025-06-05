// CustomFilter.jsx
import React from 'react'
import {
    Heading,
    Checkbox,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'

const BopisFilter = () => {
    const [isChecked, setIsChecked] = React.useState(false)

    return (
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
                onChange={(e) => setIsChecked(e.target.checked)}
            >
                In stock at Select Store
            </Checkbox>
        </Stack>
    )
}

export default BopisFilter