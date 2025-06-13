import React from 'react'
import {Button, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useLocation, useHistory} from 'react-router-dom'

const ShowcaseTopBar = () => {
    const location = useLocation()
    const history = useHistory()
    const goToPageShowcase = () => history.push('/_dev/page-showcase')
    const goToComponentShowcase = () => history.push('/_dev/component-showcase')
    const goToHooksShowcase = () => history.push('/_dev/hooks-showcase')
    const goToComponentBuilder = () => history.push('/_dev/component-builder')

    return (
        <Flex bg="gray.100" py={2} px={4} mb={4} align="center" gap={2}>
            <Button
                variant={location.pathname === '/_dev/page-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/_dev/page-showcase' ? 'blue' : 'gray'}
                onClick={goToPageShowcase}
            >
                Page Showcase
            </Button>
            <Button
                variant={location.pathname === '/_dev/component-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/_dev/component-showcase' ? 'blue' : 'gray'}
                onClick={goToComponentShowcase}
            >
                Component Showcase
            </Button>
            <Button
                variant={location.pathname === '/_dev/hooks-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/_dev/hooks-showcase' ? 'blue' : 'gray'}
                onClick={goToHooksShowcase}
            >
                Commerce SDK Hooks
            </Button>
            <Button
                variant={location.pathname === '/_dev/component-builder' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/_dev/component-builder' ? 'blue' : 'gray'}
                onClick={goToComponentBuilder}
            >
                Component Builder
            </Button>
        </Flex>
    )
}

export default ShowcaseTopBar 