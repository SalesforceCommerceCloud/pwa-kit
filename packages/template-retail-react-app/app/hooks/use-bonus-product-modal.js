import React, {useContext, useState, useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    useBreakpointValue,
    ModalHeader,
    ModalBody,
    Heading
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useAddToCartModalContext} from '@salesforce/retail-react-app/app/hooks/use-add-to-cart-modal'

export const BonusProductModalContext = React.createContext();

export const useBonusProductModalContext = () => useContext(BonusProductModalContext);

export const BonusProductModalProvider = ({children}) => {
    const bonusProductState = useBonusState();

    return (
        <BonusProductModalContext.Provider value={bonusProductState}>
            {children}
            <BonusProductModal />
        </BonusProductModalContext.Provider>
    );
};

export const BonusProductModal = () => {
    const {isOpen, data, onClose, onOpen} = useBonusProductModalContext();
    const size = useBreakpointValue({base: 'full', lg: '2xl', xl: '4xl'})

    if (!isOpen) {
        return null
    }
    return (
        <Modal size={size} isOpen={isOpen} onClose={onClose} scrollBehavior="inside" isCentered>
            <ModalOverlay />
            <ModalContent
                margin="0"
                borderRadius={{base: 'none', md: 'base'}}
                bgColor="gray.50"
                containerProps={{'data-testid': 'bonus-product-modal'}}
            >
                <ModalHeader paddingY="8" bgColor="white">
                    <Heading as="h1" fontSize="2xl">
                    </Heading>
                </ModalHeader>
                <ModalCloseButton />
                {/* Add your modal content here */}
                <ModalBody bgColor="white" padding="0" marginBottom={{base: 40, lg: 0}}></ModalBody>
            </ModalContent>
        </Modal>
    );
};

export const useBonusState = () => {
    const [state, setState] = useState({
        isOpen: false,
        data: {}
    });
    const {pathname} = useLocation();
    const {onOpen: onAddToCartModalOpen} = useAddToCartModalContext();

    useEffect(() => {
        if(state.isOpen) {
            setState({
                ...state,
                isOpen: false
            });
        }
    }, [pathname]);

    return {
        isOpen: state.isOpen,
        data: state.data,
        onClose: () => {
            setState({
                isOpen: false,
                data: {}
            });
            // Show AddToCartModal after BonusProductModal is closed
            if (state.data.product) {
                onAddToCartModalOpen({
                    product: state.data.product,
                    itemsAdded: state.data.itemsAdded,
                    selectedQuantity: state.data.selectedQuantity
                });
            }
        },
        onOpen: (data) => {
            setState({
                isOpen: true,
                data
            });
        }
    };
}