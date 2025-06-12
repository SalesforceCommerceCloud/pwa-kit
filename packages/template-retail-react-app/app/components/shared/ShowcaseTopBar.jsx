import React from 'react'
import {Button, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useLocation, useHistory} from 'react-router-dom'

const ShowcaseTopBar = () => {
    const location = useLocation()
    const history = useHistory()
    const goToPageShowcase = () => history.push('/page-showcase')
    const goToComponentShowcase = () => history.push('/component-showcase')
    const goToHooksShowcase = () => history.push('/hooks-showcase')
    const goToComponentBuilder = () => history.push('/component-builder')

    return (
        <Flex bg="gray.100" py={2} px={4} mb={4} align="center" gap={2}>
            <Button
                variant={location.pathname === '/page-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/page-showcase' ? 'blue' : 'gray'}
                onClick={goToPageShowcase}
            >
                Page Showcase
            </Button>
            <Button
                variant={location.pathname === '/component-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/component-showcase' ? 'blue' : 'gray'}
                onClick={goToComponentShowcase}
            >
                Component Showcase
            </Button>
            <Button
                variant={location.pathname === '/hooks-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/hooks-showcase' ? 'blue' : 'gray'}
                onClick={goToHooksShowcase}
            >
                Commerce SDK Hooks
            </Button>
            <Button
                variant={location.pathname === '/component-builder' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/component-builder' ? 'blue' : 'gray'}
                onClick={goToComponentBuilder}
            >
                Component Builder
            </Button>
        </Flex>
    )
}

export default ShowcaseTopBar 