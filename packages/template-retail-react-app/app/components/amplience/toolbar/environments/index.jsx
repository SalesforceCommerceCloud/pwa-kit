import {Box, Button, Heading, useMultiStyleConfig, VStack} from '@chakra-ui/react'
import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'

import {useContext} from 'react'
import {AmplienceContext} from '../../../../contexts/amplience'

const EnvironmentsPanel = ({vse, hubname}) => {
    const styles = useMultiStyleConfig('PreviewHeader')
    const {envs} = useContext(AmplienceContext)
    const [currentHub, setCurrentHub] = useState(hubname)

    const handleNewCurrentEnv = (e) => {
        const env = JSON.parse(decodeURIComponent(e.target.dataset.env))
        setCurrentHub(env.hub)
        window.location.href = `/?vse=${env.vse}&vse-timestamp=null`
    }

    useEffect(() => {
        const hub = envs.find((item) => {
            const regExp = /(.*)-(.*)-(.*)(\.staging.bigcontent.io)/
            const matches = vse.match(regExp)
            if (matches) {
                const originalVse = `${matches[1]}.staging.bigcontent.io`
                return item.vse === originalVse
            } else {
                return item.vse === vse
            }
        }).hub
        setCurrentHub(hub)
    }, [])

    return (
        <Box {...styles.box}>
            <VStack spacing={4} align="flex-start">
                {vse &&
                    envs.map((env) => {
                        if (env.hub === currentHub) {
                            return (
                                <Heading as="h4" size="xs" fontSize="xs">
                                    <b>
                                        {env.name} ({env.hub})
                                    </b>
                                </Heading>
                            )
                        } else {
                            return (
                                <>
                                    <Button
                                        fontSize="xs"
                                        style={{display: 'inline', color: '#F88B8B'}}
                                        variant="link"
                                        onClick={handleNewCurrentEnv}
                                        data-env={encodeURIComponent(JSON.stringify(env))}
                                    >
                                        {env.name} ({env.hub})
                                    </Button>
                                </>
                            )
                        }
                    })}
            </VStack>
        </Box>
    )
}

EnvironmentsPanel.propTypes = {
    vse: PropTypes.string,
    hubname: PropTypes.string
}

export default EnvironmentsPanel
