import React from 'react'
import PropTypes from 'prop-types'
import {Box, Heading, Stack, Text, Container} from '@chakra-ui/react'
import Button from '../button'

/**
 * Section component used on content pages like home page.
 * This component helps with creating a consistent layout and
 * consistent typography styles for section headings.
 */
const Section = ({title, subtitle, actions, maxWidth, children, ...props}) => {
    const sectionMaxWidth = maxWidth || '3xl'
    return (
        <Box
            as={'section'}
            marginTop="4"
            marginBottom="8"
            paddingTop="8"
            paddingBottom="16"
            {...props}
        >
            <Stack spacing={4} as={Container} maxW={sectionMaxWidth} textAlign={'center'}>
                {title && (
                    <Heading as="h2" fontSize={40} textAlign="center">
                        {title}
                    </Heading>
                )}
                {subtitle && (
                    <Text color={'gray.700'} fontWeight={600}>
                        {subtitle}
                    </Text>
                )}

                {actions && (
                    <Box width={{base: 'full', md: 'auto'}}>
                        {actions.map((props, ind) => (
                            <Button margin="1" key={ind} label={props.label} url={props.url} />
                        ))}
                    </Box>
                )}
            </Stack>
            {children}
        </Box>
    )
}

Section.displayName = 'Section'

Section.propTypes = {
    /**
     * Section component main title
     */
    title: PropTypes.string,
    /**
     * Section component subtitle
     */
    subtitle: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.node]),
    /**
     * Section children node(s)
     */
    children: PropTypes.node,
    /**
     * Call to action component(s)
     */
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string,
            url: PropTypes.string
        })
    ),
    /**
     * Section maximum width
     */
    maxWidth: PropTypes.string
}

export default Section
