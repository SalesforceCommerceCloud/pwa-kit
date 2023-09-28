import React from 'react'
import PropTypes from 'prop-types'
import AmplienceWrapper from '../wrapper'
import AmplienceMarkdown from '../markdown'
import {Box, Heading} from '@chakra-ui/react'
import styled from '@emotion/styled'

import {TrueAdaptiveImage} from '../adaptive-image'

const Contain = styled(Box)`
    .amp-rich-text h1 {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 0.4em;
    }

    .amp-rich-text h2 {
        font-size: 2.25rem;
        font-weight: 700;
        margin-bottom: 0.4em;
    }

    .amp-rich-text h3 {
        font-size: 1.875rem;
        font-weight: 700;
        margin-bottom: 0.4em;
    }

    .amp-rich-text h4 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.4em;
    }

    .amp-rich-text h5 {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.4em;
    }

    .amp-rich-text h6 {
        font-size: 0.8rem;
        font-weight: 700;
        margin-bottom: 0.6em;
    }

    .amp-rich-text > p {
        margin-block-end: 1em;
    }

    .amp-rich-text > p > img {
        margin: 0 auto;
    }

    .amp-rich-text img {
        max-height: 50vh;
    }

    .amp-rich-text a {
        color: #0176d3;
        font-weight: 600;
    }

    .amp-rich-text blockquote {
        border-left: 5px solid #c9c9c9;
        padding-inline-start: 1em;
        padding-top: 0.25em;
        padding-bottom: 0.25em;
        margin-inline-start: 1em;
        margin-block-end: 1em;
    }

    .amp-rich-text pre {
        margin-block-end: 1em;
    }

    .amp-rich-text ul {
        margin-inline-start: 1.5em;
        margin-block-end: 1em;
    }

    .amp-rich-text ol {
        margin-inline-start: 1.5em;
        margin-block-end: 1em;
    }
`

/**
 * Amplience Rich Text Component
 * Renders content authored by the Rich Text Extension.
 * Blocks of markdown text interspersed with content blocks.
 */
const AmplienceRichText = ({header, content}) => {
    return (
        <>
            <Contain>
                {header && (
                    <Heading pb="8" as="h2">
                        {header}
                    </Heading>
                )}
                {content?.richText?.map((item, index) => {
                    switch (item.type) {
                        case 'markdown':
                            return (
                                <Box mt={4} mb={4}>
                                    <AmplienceMarkdown
                                        content={item.data}
                                        key={index}
                                        className="amp-rich-text"
                                    />
                                </Box>
                            )
                        case 'dc-content-link':
                            return (
                                <Box mt={4} mb={4}>
                                    <AmplienceWrapper content={item.data} key={index} />
                                </Box>
                            )
                        case 'dc-image-link': {
                            return (
                                <Box mt={4} mb={4}>
                                    <TrueAdaptiveImage
                                        image={item.data}
                                        key={index}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '50vh',
                                            margin: '0 auto',
                                            marginBlockEnd: '1em'
                                        }}
                                    />
                                </Box>
                            )
                        }
                    }
                })}
            </Contain>
        </>
    )
}

AmplienceRichText.displayName = 'AmplienceRichText'

AmplienceRichText.propTypes = {
    /**
     * Header to display above content.
     */
    header: PropTypes.string,
    /**
     * Rich Text Content
     */
    content: PropTypes.array
}

export default AmplienceRichText
