/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Heading,
    List,
    // hooks
    useSlotRecipe
} from '@chakra-ui/react'
import Link from '../../components/link'

const LinksList = ({
    links = [],
    heading = '',
    variant,
    color,
    onLinkClick,
    headingLinkRef,
    ...otherProps
}) => {
    const recipe = useSlotRecipe({key: 'linkList'})
    const styles = recipe({variant})
    return (
        <Box
            css={{
                ...styles.container,
                ...(color ? {color} : {})
            }}
            {...otherProps}
        >
            {heading &&
                (heading.href ? (
                    <Link
                        to={heading.href}
                        onClick={onLinkClick}
                        ref={headingLinkRef}
                        css={styles.headingLink}
                    >
                        <Heading
                            css={{...styles.heading, ...(heading.styles ? heading.styles : {})}}
                        >
                            {heading.text}
                        </Heading>
                    </Link>
                ) : (
                    <Heading css={styles.heading}>{heading}</Heading>
                ))}

            {links && (
                <List.Root
                    variant="plain"
                    css={styles.list}
                    data-testid={variant === 'horizontal' ? 'horizontal-list' : undefined}
                >
                    {links.map((link, i) => (
                        <List.Item key={i} css={styles.listItem}>
                            <Link
                                css={{...styles.link, ...(link.styles ? link.styles : {})}}
                                to={link.href}
                                onClick={onLinkClick}
                            >
                                {link.text}
                            </Link>
                        </List.Item>
                    ))}
                </List.Root>
            )}
        </Box>
    )
}

LinksList.propTypes = {
    links: PropTypes.arrayOf(
        PropTypes.shape({
            href: PropTypes.string,
            text: PropTypes.string
        })
    ).isRequired,
    heading: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    variant: PropTypes.oneOfType([
        PropTypes.oneOf(['vertical', 'horizontal']),
        PropTypes.object // For responsive variants like {base: 'vertical', lg: 'horizontal'}
    ]),
    color: PropTypes.string,
    onLinkClick: PropTypes.func,
    headingLinkRef: PropTypes.object
}

export default LinksList
