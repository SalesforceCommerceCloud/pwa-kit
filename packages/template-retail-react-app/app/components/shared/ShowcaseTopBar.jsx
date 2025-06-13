import React from 'react'
import {Button, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useLocation, useHistory} from 'react-router-dom'

const ShowcaseTopBar = () => {
    const location = useLocation()
    const history = useHistory()
    const goToPageShowcase = () => history.push('/develop/page-showcase')
    const goToComponentShowcase = () => history.push('/develop/component-showcase')
    const goToHooksShowcase = () => history.push('/develop/hooks-showcase')
    const goToComponentBuilder = () => history.push('/develop/component-builder')

    return (
        <Flex bg="gray.100" py={2} px={4} mb={4} align="center" gap={2}>
            <Button
                variant={location.pathname === '/develop/page-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/develop/page-showcase' ? 'blue' : 'gray'}
                onClick={goToPageShowcase}
            >
                Page Showcase
            </Button>
            <Button
                variant={location.pathname === '/develop/component-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/develop/component-showcase' ? 'blue' : 'gray'}
                onClick={goToComponentShowcase}
            >
                Component Showcase
            </Button>
            <Button
                variant={location.pathname === '/develop/hooks-showcase' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/develop/hooks-showcase' ? 'blue' : 'gray'}
                onClick={goToHooksShowcase}
            >
                Commerce SDK Hooks
            </Button>
            <Button
                variant={location.pathname === '/develop/component-builder' ? 'solid' : 'ghost'}
                colorScheme={location.pathname === '/develop/component-builder' ? 'blue' : 'gray'}
                onClick={goToComponentBuilder}
            >
                Component Builder
            </Button>
        </Flex>
    )
}

export default ShowcaseTopBar 