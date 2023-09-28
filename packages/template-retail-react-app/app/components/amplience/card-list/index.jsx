import React from 'react'
import PropTypes from 'prop-types'
import {Box, Heading, HStack} from '@chakra-ui/react'
import AmplienceWrapper from '../wrapper'

const CardList = ({header, cards}) => {
    return (
        <Box>
            {header && <Heading as="h2">{header}</Heading>}
            <HStack isInline={true} alignItems={'flex-start'} pt={8} spacing={4}>
                {cards &&
                    cards.map((card, i) => {
                        return <AmplienceWrapper content={card} key={i} />
                    })}
            </HStack>
        </Box>
    )
}

CardList.displayName = 'Card List'

CardList.propTypes = {
    header: PropTypes.string,
    cards: PropTypes.array
}

export default CardList
