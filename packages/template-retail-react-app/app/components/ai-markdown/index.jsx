/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderAiMarkdown} from '@salesforce/retail-react-app/app/utils/ai-markdown'

const AiMarkdown = ({children, ...props}) => {
    const markup = useMemo(() => ({__html: renderAiMarkdown(children)}), [children])
    return (
        <Box
            {...props}
            sx={{
                overflowWrap: 'anywhere',
                '& > :first-child': {mt: 0},
                '& > :last-child': {mb: 0},
                '& p, & ul, & ol, & blockquote, & pre, & table': {mb: 3},
                '& ul, & ol': {pl: 6},
                '& ul': {listStyleType: 'disc'},
                '& ol': {listStyleType: 'decimal'},
                '& li + li': {mt: 1},
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                    fontSize: '1.1em',
                    fontWeight: 600,
                    mt: 4,
                    mb: 2
                },
                '& a': {color: '#315f39', textDecoration: 'underline'},
                '& blockquote': {borderLeft: '3px solid #a9bba1', pl: 4, color: '#586650'},
                '& code': {
                    fontFamily: 'monospace',
                    fontSize: '.9em',
                    bg: '#edf1e8',
                    px: 1,
                    borderRadius: '3px'
                },
                '& pre': {
                    overflowX: 'auto',
                    bg: '#edf1e8',
                    p: 3,
                    borderRadius: '6px',
                    whiteSpace: 'pre'
                },
                '& pre code': {p: 0},
                '& table': {display: 'block', overflowX: 'auto', borderCollapse: 'collapse'},
                '& th, & td': {border: '1px solid #d4ddce', px: 3, py: 2, textAlign: 'start'},
                '& th': {fontWeight: 600, bg: '#eef2e9'}
            }}
            dangerouslySetInnerHTML={markup}
        />
    )
}
AiMarkdown.propTypes = {children: PropTypes.string}
export default AiMarkdown
