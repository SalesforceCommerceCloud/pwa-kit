import {
    Box,
    Heading,
    Input,
    IconButton,
    useClipboard,
    useMultiStyleConfig,
    Wrap,
    Text,
    HStack,
    Switch
} from '@chakra-ui/react'
import React, {useEffect, useState} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {CopyIcon} from '@chakra-ui/icons'

import {useContext} from 'react'
import {AmplienceContext} from '../../../../contexts/amplience'

const VisualisationPanel = ({showVse, hubname, locale, contentId, toolbarState}) => {
    const intl = useIntl()
    const styles = useMultiStyleConfig('PreviewHeader')
    const {envs} = useContext(AmplienceContext)

    const currentHub =
        hubname ||
        envs?.find((item) => {
            const regExp = /(.*)-(.*)-(.*)(\.staging.bigcontent.io)/
            const matches = showVse.match(regExp)
            if (matches) {
                const originalVse = `${matches[1]}.staging.bigcontent.io`
                return item.vse === originalVse
            } else {
                return item.vse === showVse
            }
        })?.hub

    const {hasCopied: hasCopiedHub, onCopy: onCopyHub} = useClipboard(currentHub)
    const {hasCopied: hasCopiedVse, onCopy: onCopyVse} = useClipboard(showVse)
    const {hasCopied: hasCopiedLocale, onCopy: onCopyLocale} = useClipboard(locale || intl.locale)
    const {hasCopied: hasCopiedContentId, onCopy: onCopyContentId} = useClipboard(contentId || null)

    const [matchVisible, setMatchVisible] = useState(toolbarState.matchVisible)
    const bgColorHub = hasCopiedHub ? 'gray.500' : 'amplienceColor.500'
    const bgColorVse = hasCopiedVse ? 'gray.500' : 'amplienceColor.500'
    const bgColorLocale = hasCopiedLocale ? 'gray.500' : 'amplienceColor.500'
    const bgColorContent = hasCopiedContentId ? 'gray.500' : 'amplienceColor.500'

    useEffect(() => {
        if (document) {
            const body = document.getElementsByTagName('body')

            if (body && !matchVisible) {
                body[0].classList.add('matchVisible')
            } else if (body && matchVisible) {
                body[0].classList.remove('matchVisible')
            }
        }
    }, [matchVisible])

    const switchInfo = () => {
        toolbarState.matchVisible = !matchVisible
        setMatchVisible(!matchVisible)
    }

    return (
        <Box {...styles.box}>
            {showVse && (
                <>
                    <Heading as="h4" mb={2} size="xs">
                        {intl.formatMessage({
                            id: 'toolbar.visualisation.title',
                            defaultMessage: 'Hub Name'
                        })}
                    </Heading>
                    <HStack>
                        <Input size="xs" isReadonly={true} value={currentHub} />
                        <IconButton
                            size="xs"
                            colorScheme={'amplienceColor'}
                            bgColor={bgColorHub}
                            onClick={onCopyHub}
                            aria-label="Copy"
                            icon={<CopyIcon />}
                        />
                    </HStack>
                    <Heading as="h4" size="xs" mt={4} mb={2}>
                        VSE
                    </Heading>
                    <HStack>
                        <Input size="xs" isReadonly={true} value={showVse} />
                        <IconButton
                            size="xs"
                            colorScheme={'amplienceColor'}
                            bgColor={bgColorVse}
                            onClick={onCopyVse}
                            aria-label="Copy"
                            icon={<CopyIcon />}
                        />
                    </HStack>
                    <Heading as="h4" size="xs" mt={4} mb={2}>
                        {intl.formatMessage({
                            id: 'toolbar.visualisation.locale',
                            defaultMessage: 'Locale'
                        })}
                    </Heading>
                    <HStack>
                        <Input size="xs" isReadonly={true} value={locale || intl.locale} />
                        <IconButton
                            colorScheme={'amplienceColor'}
                            size="xs"
                            bgColor={bgColorLocale}
                            onClick={onCopyLocale}
                            aria-label="Copy"
                            icon={<CopyIcon />}
                        />
                    </HStack>
                    {contentId && (
                        <>
                            <Heading as="h4" size="xs" mt={4} mb={2}>
                                {intl.formatMessage({
                                    id: 'toolbar.visualisation.content',
                                    defaultMessage: 'Content ID'
                                })}
                            </Heading>
                            <HStack>
                                <Input size="xs" isReadonly={true} value={contentId} />
                                <IconButton
                                    colorScheme={'amplienceColor'}
                                    size="xs"
                                    bgColor={bgColorContent}
                                    onClick={onCopyContentId}
                                    aria-label="Copy"
                                    icon={<CopyIcon />}
                                />
                            </HStack>
                        </>
                    )}
                    <Wrap spacing={2} paddingTop={6} marginBottom={6}>
                        <Switch
                            defaultChecked={toolbarState.matchVisible}
                            size="sm"
                            onChange={switchInfo}
                            colorScheme={'amplienceColor'}
                            isChecked={matchVisible}
                        />
                        <Text onClick={switchInfo} fontSize="xs">
                            {intl.formatMessage({
                                id: 'toolbar.visualisation.showMatches',
                                defaultMessage: 'Show information'
                            })}
                        </Text>
                    </Wrap>
                </>
            )}
        </Box>
    )
}

VisualisationPanel.propTypes = {
    vse: PropTypes.string,
    hubname: PropTypes.string,
    locale: PropTypes.string,
    contentId: PropTypes.string,
    toolbarState: PropTypes.object
}

export default VisualisationPanel
