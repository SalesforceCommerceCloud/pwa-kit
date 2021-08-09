import React, {Fragment} from 'react'
import {FormattedMessage} from 'react-intl'
import {Flex, Button} from '@chakra-ui/react'
import {AmexIcon, DiscoverIcon, LockIcon, MastercardIcon, VisaIcon} from '../../../components/icons'
import Link from '../../../components/link'

const CartCta = () => {
    return (
        <Fragment>
            <Button
                as={Link}
                to="/checkout"
                width={['95%', '95%', '95%', '100%']}
                marginTop={[6, 6, 2, 2]}
                mb={4}
                rightIcon={<LockIcon />}
                variant="solid"
            >
                <FormattedMessage defaultMessage="Proceed to Checkout" />
            </Button>
            <Flex justify={'center'}>
                <VisaIcon height={8} width={10} mr={2} />
                <MastercardIcon height={8} width={10} mr={2} />
                <AmexIcon height={8} width={10} mr={2} />
                <DiscoverIcon height={8} width={10} mr={2} />
            </Flex>
        </Fragment>
    )
}

export default CartCta
