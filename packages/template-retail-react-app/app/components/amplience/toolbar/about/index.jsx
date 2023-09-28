import {
    Box,
    Heading,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    useMultiStyleConfig
} from '@chakra-ui/react'
import React from 'react'
import PropTypes from 'prop-types'
import AmplienceWrapper from '../../wrapper'
import styled from '@emotion/styled'
import {useIntl} from 'react-intl'

const StyledBox = styled(Box)`
    .matchInfo {
        display: none !important;
    }

    p {
        font-size: 0.75rem;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    h2 {
        font-size: 0.75rem;
        padding-bottom: 10px;
    }
`

const AboutPanel = ({toolbarOpacity, setToolbarOpacity}) => {
    const styles = useMultiStyleConfig('PreviewHeader')
    const {formatMessage} = useIntl()

    return (
        <StyledBox {...styles.box}>
            <AmplienceWrapper fetch={{key: 'rich-text/amplience-toolbar'}}></AmplienceWrapper>
            <Heading mt={8} mb={2} as="h2" fontSize="xs">
                {formatMessage({
                    defaultMessage: 'Toolbar Opacity',
                    id: 'toolbar.about.heading'
                })}
            </Heading>
            <Slider
                aria-label={formatMessage({
                    defaultMessage: 'Toolbar Opacity',
                    id: 'toolbar.about.heading'
                })}
                defaultValue={toolbarOpacity * 200 - 100}
                step={1}
                colorScheme={'amplienceColor'}
                onChange={(val) => setToolbarOpacity(0.5 + val / 200.0)}
            >
                <SliderTrack>
                    <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb borderColor={'gray.500'} borderWidth={2} />
            </Slider>
        </StyledBox>
    )
}

AboutPanel.propTypes = {
    toolbarOpacity: PropTypes.number,
    setToolbarOpacity: PropTypes.any
}

export default AboutPanel
