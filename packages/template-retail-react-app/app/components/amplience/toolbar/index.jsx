import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    IconButton,
    useMultiStyleConfig,
    Drawer,
    useDisclosure,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    Heading,
    Text,
    HStack
} from '@chakra-ui/react'
import {
    SettingsIcon,
    CloseIcon,
    ChevronLeftIcon,
    CalendarIcon,
    ViewIcon,
    ExternalLinkIcon,
    InfoOutlineIcon
} from '@chakra-ui/icons'
import VisualisationPanel from './visualisation'
import PersonalisationPanel from './personalisation'
import PreviewPanel from './preview'
import EnvironmentsPanel from './environments'
import AboutPanel from './about'
import {AmplienceLogo} from '../../icons'

import {useContext} from 'react'
import {AmplienceContext} from '../../../contexts/amplience'
import {useState} from 'react'
import {useIntl} from 'react-intl'

const AccordionItemRender = ({title, Icon, Component, onClick, ...otherProps}) => {
    const styles = useMultiStyleConfig('PreviewHeader')

    return (
        <AccordionItem {...styles.section}>
            <AccordionButton onClick={onClick} {...styles.button}>
                <Box flex="1" textAlign="left" {...styles.sectionTitle}>
                    <Heading as="h2" size="xs">
                        <HStack>
                            {Icon && <Icon />}
                            <Text casing="uppercase">{title}</Text>
                        </HStack>
                    </Heading>
                </Box>
                <AccordionIcon />
            </AccordionButton>
            <AccordionPanel {...styles.pannel}>
                <Component {...otherProps} />
            </AccordionPanel>
        </AccordionItem>
    )
}

const Toolbar = (props) => {
    const {envs} = useContext(AmplienceContext)
    const {formatMessage} = useIntl()
    const [toolbarState] = useState({matchVisible: true})

    function inIframe() {
        try {
            return window.self !== window.top
        } catch (e) {
            return true
        }
    }

    const items = [
        {
            title: formatMessage({
                defaultMessage: 'Preview',
                id: 'toolbar.title.preview'
            }),
            Icon: CalendarIcon,
            Component: PreviewPanel,
            visibility: ({vseTimestamp}) => !!vseTimestamp
        },
        {
            title: formatMessage({
                defaultMessage: 'Visualisation',
                id: 'toolbar.title.visualisation'
            }),
            Icon: ViewIcon,
            Component: VisualisationPanel,
            visibility: () => !!props.showVse
        },
        {
            title: formatMessage({
                defaultMessage: 'Environments',
                id: 'toolbar.title.environments'
            }),
            Icon: ExternalLinkIcon,
            Component: EnvironmentsPanel,
            visibility: () => !!props.vse && envs && envs.length > 0
        },
        {
            title: formatMessage({
                defaultMessage: 'Personalisation',
                id: 'toolbar.title.personalisation'
            }),
            Icon: SettingsIcon,
            Component: PersonalisationPanel
        },
        {
            title: formatMessage({
                defaultMessage: 'About The Toolbar',
                id: 'toolbar.title.about'
            }),
            Icon: InfoOutlineIcon,
            Component: AboutPanel
        }
    ]
    const styles = useMultiStyleConfig('PreviewHeader')

    const {isOpen, onToggle, onClose} = useDisclosure()
    const deleteCookie = (name) => {
        document.cookie = name + '=; max-age=0;'
    }

    const clearVse = () => {
        deleteCookie('vse')
        deleteCookie('vse-timestamp')
        window.location.assign('/')
    }

    const [toolbarOpacity, setToolbarOpacity] = useState(100)
    const [openedPanels, setOpenedPanels] = useState(props.vseTimestamp ? [0, 1] : [0])

    return (
        <>
            <IconButton
                icon={<SettingsIcon title={'Open'} />}
                onClick={onToggle}
                style={{
                    opacity: isOpen ? 0 : 1
                }}
                {...styles.previewIcon}
                {...styles.previewIconInitial}
            />
            <Drawer
                placement={'left'}
                onClose={onClose}
                isOpen={isOpen}
                size={'sm'}
                blockScrollOnMount={false}
                trapFocus={false}
            >
                <DrawerOverlay />
                <div>
                    <IconButton
                        icon={<ChevronLeftIcon {...styles.backIcon} />}
                        onClick={onToggle}
                        title={'Close'}
                        {...styles.previewIcon}
                        left={{base: 'calc(100vw - 50px)', sm: '460px'}}
                    />
                    <IconButton
                        icon={<CloseIcon />}
                        onClick={clearVse}
                        title={'Exit'}
                        {...styles.previewIcon}
                        {...styles.previewIconClose}
                        left={{base: 'calc(100vw - 50px)', sm: '460px'}}
                        display={inIframe() ? 'none' : 'block'}
                    />
                </div>
                <DrawerContent opacity={toolbarOpacity}>
                    <DrawerHeader {...styles.header} mt={10}>
                        <AmplienceLogo color={'#000000'} width={'unset'} height={'unset'} mb={10} />
                    </DrawerHeader>
                    <DrawerBody padding={0}>
                        <Accordion
                            allowToggle={true}
                            defaultIndex={openedPanels}
                            allowMultiple={true}
                        >
                            {items
                                .filter((data) => {
                                    data.visibility = data.visibility || (() => true)
                                    return (
                                        data.visibility &&
                                        typeof data.visibility === 'function' &&
                                        data.visibility({...props})
                                    )
                                })
                                .map((data, index) => {
                                    return (
                                        <AccordionItemRender
                                            key={index}
                                            onClick={() => {
                                                if (openedPanels.includes(index)) {
                                                    setOpenedPanels((prevState) =>
                                                        prevState.filter((item) => item != index)
                                                    )
                                                } else {
                                                    setOpenedPanels((prevState) => [
                                                        ...prevState,
                                                        index
                                                    ])
                                                }
                                            }}
                                            {...data}
                                            {...props}
                                            toolbarState={toolbarState}
                                            toolbarOpacity={toolbarOpacity}
                                            setToolbarOpacity={setToolbarOpacity}
                                        />
                                    )
                                })}
                        </Accordion>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    )
}

Toolbar.propTypes = {
    vse: PropTypes.string,
    vseTimestamp: PropTypes.number,
    customerGroups: PropTypes.array,
    showVse: PropTypes.bool
}

export default Toolbar
