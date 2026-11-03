/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import AiMarkdown from '@salesforce/retail-react-app/app/components/ai-markdown'

test('renders Markdown as semantic markup, including lists and tables', () => {
    const {container} = render(
        <AiMarkdown>
            {
                '## Jacket picks\n\n- **Waterproof** and *lightweight*\n- ~~Heavy~~ `shell`\n\n1. Check fit\n\n> Catalog facts\n\n```text\n<safe code>\n```\n\n| Jacket | Price |\n| --- | --- |\n| Trail | $99 |'
            }
        </AiMarkdown>
    )
    expect(screen.getByRole('heading', {name: 'Jacket picks'})).toBeInTheDocument()
    expect(container.querySelector('strong')).toHaveTextContent('Waterproof')
    expect(container.querySelector('em')).toHaveTextContent('lightweight')
    expect(screen.getAllByRole('list')).toHaveLength(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(container.querySelector('blockquote')).toHaveTextContent('Catalog facts')
    expect(container.querySelector('pre code')).toHaveTextContent('<safe code>')
})
test('raw HTML and model-supplied remote images remain inert', () => {
    const {container} = render(
        <AiMarkdown>
            {
                '<img src=x onerror=alert(1)>\n\n<script>alert(1)</script>\n\n<svg onload=alert(1)></svg>\n\n![Jacket](https://tracker.example/a.png)'
            }
        </AiMarkdown>
    )
    expect(container.querySelector('script, img, svg')).toBeNull()
    expect(container).toHaveTextContent('<script>alert(1)</script>')
    expect(container).toHaveTextContent('Jacket')
})
test.each([
    ['java', 'script:alert(1)'].join(''),
    '&#x6a;avascript:alert(1)',
    'data:text/html,bad',
    'file:///etc/passwd',
    '//evil.example/a',
    'https://user:password@shop.example/a'
])('rejects unsafe link %s', (url) => {
    render(<AiMarkdown>{`[Product](${url})`}</AiMarkdown>)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
test('formats a partially streamed answer when the closing marker arrives', () => {
    const {container, rerender} = render(<AiMarkdown>{'**Water'}</AiMarkdown>)
    expect(container).toHaveTextContent('**Water')
    rerender(<AiMarkdown>{'**Waterproof** jacket'}</AiMarkdown>)
    expect(container.querySelector('strong')).toHaveTextContent('Waterproof')
    expect(container).not.toHaveTextContent('**')
})
