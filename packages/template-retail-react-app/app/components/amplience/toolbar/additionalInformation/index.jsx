import React, {useContext} from 'react'
import {
    IconButton,
    Popover,
    PopoverContent,
    PopoverBody,
    PopoverArrow,
    useDisclosure,
    useMultiStyleConfig,
    PopoverTrigger,
    Link,
    Text,
    Heading,
    Box,
    Divider,
    Spacer
} from '@chakra-ui/react'
import {CheckIcon, CheckCircleIcon, CloseIcon} from '@chakra-ui/icons'
import {AmplienceContext} from '../../../../contexts/amplience'
import moment from 'moment'
import {useIntl} from 'react-intl'

const Legend = () => {
    const styles = useMultiStyleConfig('PreviewHeader')
    const {formatMessage} = useIntl()

    return (
        <Box>
            <Box>
                <Heading as="h4" mt={4} mb={2} fontSize={'xs'}>
                    {formatMessage({
                        defaultMessage: 'Legend',
                        id: 'toolbar.additional.legend'
                    })}
                </Heading>
                <CheckCircleIcon {...styles.infoBox} color={'green'} width={'14px'} />
                <Text fontSize="xs" as={'span'}>
                    {formatMessage({
                        defaultMessage: 'Match on default or variant',
                        id: 'toolbar.additional.match'
                    })}
                </Text>
            </Box>
            <Box>
                <CloseIcon {...styles.infoBox} color={'red'} />
                <Text fontSize="xs" as={'span'}>
                    {formatMessage({
                        defaultMessage: 'No match on default or variant',
                        id: 'toolbar.additional.noMatch'
                    })}
                </Text>
            </Box>
            <Box>
                <CheckIcon {...styles.infoBox} color={'grey'} />
                <Text fontSize="xs" as={'span'}>
                    {formatMessage({
                        defaultMessage: 'Match on variant, but ignored (max items reached)',
                        id: 'toolbar.additional.limit'
                    })}
                </Text>
            </Box>
        </Box>
    )
}

const AdditionalInformation = ({_meta, slot, matchesList}) => {
    const styles = useMultiStyleConfig('PreviewHeader')
    const {defaultEnv, envs, vse = ''} = useContext(AmplienceContext)
    const currentHub =
        envs?.find((item) => {
            const regExp = /(.*)-(.*)-(.*)(\.staging.bigcontent.io)/
            const matches = vse.match(regExp)
            if (matches) {
                const originalVse = `${matches[1]}.staging.bigcontent.io`
                return item.vse === originalVse
            } else {
                return item.vse === vse
            }
        })?.hub || defaultEnv.hub

    const SlotContentRender = ({deliveryId, name, schema, deliveryKey, content}) => (
        <>
            <Heading as="h2" size="xs">
                <Link
                    color={'amplienceColor.500'}
                    target={'_blank'}
                    href={`https://content.amplience.net/#!/${currentHub}/authoring/content-item/edit/${deliveryId}`}
                >
                    {name}
                </Link>
            </Heading>
            {content && (
                <Heading as="h2" size="xs">
                    <Link
                        color={'amplienceColor.500'}
                        target={'_blank'}
                        href={`https://content.amplience.net/#!/${currentHub}/authoring/content-item/edit/${content.deliveryId}`}
                    >
                        {' '}
                        {'>'} {content.name}
                    </Link>
                </Heading>
            )}
            <Text fontSize="xs" fontWeight={'bold'}>
                {schema}
            </Text>
            <Text fontSize="xs" fontStyle={'italic'}>
                {deliveryId}
            </Text>
            {deliveryKey && (
                <Text fontSize="xs" fontStyle={'italic'}>
                    {deliveryKey}
                </Text>
            )}
        </>
    )

    const EditionRender = ({deliveryId, name, edition: {id, start, end}}) => (
        <>
            <Heading as="h2" size="xs">
                <Link
                    color={'amplienceColor.500'}
                    target={'_blank'}
                    href={`https://content.amplience.net/#!/${currentHub}/authoring/content-item/edit/${deliveryId}`}
                >
                    {name}
                </Link>
            </Heading>
            <Text fontSize="xs" fontWeight={'bold'}>
                {moment(start).format(`DD/MM/YYYY HH:mm:ss`)}
            </Text>
            <Text fontSize="xs" fontWeight={'bold'}>
                {moment(end).format(`DD/MM/YYYY HH:mm:ss`)}
            </Text>
            {id && (
                <Text fontSize="xs" fontStyle={'italic'}>
                    {id}
                </Text>
            )}
        </>
    )

    const PersonalisationRender = ({deliveryId, name, matchesList}) => {
        const {formatMessage} = useIntl()
        return (
            <>
                <Heading as="h2" size="xs">
                    <Link
                        color={'amplienceColor.500'}
                        target={'_blank'}
                        href={`https://content.amplience.net/#!/${currentHub}/authoring/content-item/edit/${deliveryId}`}
                    >
                        {name}
                    </Link>
                </Heading>
                {matchesList.map(({title, isDefault, match, maxReached}, index) => (
                    <Box key={index}>
                        {match && !maxReached ? (
                            <CheckCircleIcon {...styles.infoBox} color={'green'} width={'14px'} />
                        ) : match && maxReached ? (
                            <CheckIcon {...styles.infoBox} color={'grey'} />
                        ) : (
                            <CloseIcon {...styles.infoBox} color={'red'} />
                        )}
                        <Text fontSize="xs" as={'span'}>
                            {isDefault
                                ? formatMessage({
                                      defaultMessage: 'Default variant',
                                      id: 'toolbar.additional.default'
                                  })
                                : `${formatMessage({
                                      defaultMessage: 'Variant',
                                      id: 'toolbar.additional.variant'
                                  })} ${title}`}
                        </Text>
                    </Box>
                ))}
                <Spacer h={6} />
                <Divider />
                <Legend />
            </>
        )
    }

    const items = [
        {
            color: 'teal',
            icon: <p>P</p>,
            content: <PersonalisationRender matchesList={matchesList} {..._meta} />,
            visibility: () => matchesList && matchesList.length
        },
        {
            color: 'orange',
            icon: <p>S</p>,
            content: <SlotContentRender {...slot} content={_meta} />,
            visibility: () => !!slot
        },
        {
            color: 'blue',
            icon: <p>C</p>,
            content: <SlotContentRender {..._meta} />
        },
        {
            color: 'pink',
            icon: <p>E</p>,
            content: <EditionRender {...slot} />,
            visibility: () => slot && !!slot.edition
        }
    ]

    return (
        <div style={styles.infoContainer} className={'matchInfo'}>
            {items
                .filter((data) => {
                    data.visibility = data.visibility || (() => true)
                    return (
                        data.visibility &&
                        typeof data.visibility === 'function' &&
                        data.visibility()
                    )
                })
                .map(({icon, content, color}, index) => {
                    const {isOpen, onToggle, onClose} = useDisclosure()

                    return (
                        <React.Fragment key={index}>
                            <Popover
                                isOpen={isOpen}
                                onClose={onClose}
                                closeOnBlur={true}
                                size={'sm'}
                            >
                                <PopoverTrigger>
                                    <IconButton
                                        zIndex={2}
                                        onClick={onToggle}
                                        colorScheme={color}
                                        size="sm"
                                        icon={icon}
                                        {...styles.infoIcon}
                                    />
                                </PopoverTrigger>
                                <PopoverContent>
                                    <PopoverArrow />
                                    <PopoverBody {...styles.popoverBody}>{content}</PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </React.Fragment>
                    )
                })}
        </div>
    )
}

AdditionalInformation.propTypes = {}

export default AdditionalInformation
