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
                width="95%"
                marginTop={6}
                mb={4}
                rightIcon={<LockIcon />}
                variant="solid"
            >
                <FormattedMessage defaultMessage="Proceed to Checkout" />
            </Button>
            <Flex margin="auto" width="140px" justify="space-between" paddingBottom={11}>
                <VisaIcon />
                <MastercardIcon />
                <AmexIcon />
                <DiscoverIcon />
            </Flex>
        </Fragment>
    )
}

export default CartCta
