import React from 'react'
import {Stack, Heading} from '@chakra-ui/layout'
import {FormattedMessage, useIntl} from 'react-intl'
import PageActionPlaceHolder from '../../../components/page-action-placeholder'
import {WishlistIcon} from '../../../components/icons'
import useNavigation from '../../../hooks/use-navigation'

const AccountWishlist = () => {
    const navigate = useNavigation()
    const {formatMessage} = useIntl()

    return (
        <Stack spacing={4} data-testid="account-wishlist-page">
            <Heading as="h1" fontSize="2xl">
                <FormattedMessage defaultMessage="Wishlist" />
            </Heading>
            <PageActionPlaceHolder
                icon={<WishlistIcon boxSize={8} />}
                heading={formatMessage({defaultMessage: 'No Wishlist Items'})}
                text={formatMessage({
                    defaultMessage: 'Continue shopping and add items to your wishlist'
                })}
                buttonText={formatMessage({
                    defaultMessage: 'Continue Shopping'
                })}
                buttonProps={{leftIcon: undefined}}
                onButtonClick={() => navigate('/')}
            />
        </Stack>
    )
}

export default AccountWishlist
