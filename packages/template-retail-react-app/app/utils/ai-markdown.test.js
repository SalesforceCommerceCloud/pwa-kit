/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {renderAiMarkdown} from '@salesforce/retail-react-app/app/utils/ai-markdown'

test('renders formatted overview content', () => {
    const html = renderAiMarkdown('**Top matches**\n\n- Linen shirt\n- Cotton sweater')
    expect(html).toContain('<strong>Top matches</strong>')
    expect(html).toContain('<li>Linen shirt</li>')
})

test('escapes HTML, disables images, and rejects unsafe links in model output', () => {
    const html = renderAiMarkdown(
        '<script>alert(1)</script>\n\n![Alt text](https://example.com/img.png) [Link](javascript:alert%281%29)'
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Alt text')
    expect(html).not.toMatch(/<img|<script|href="javascript:/i)
})
