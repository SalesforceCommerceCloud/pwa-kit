/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import MarkdownIt from '@salesforce/retail-react-app/app/static/vendor/markdown-it.min.cjs'

// Keep this policy aligned with SFRA search-markdown.js. Never enable raw HTML/plugins.
const parser = new MarkdownIt({html: false, linkify: false, typographer: false})
const defaultValidateLink = parser.validateLink
parser.validateLink = (value) => {
    // eslint-disable-next-line no-control-regex -- Reject control characters in model-authored URLs.
    if (!defaultValidateLink(value) || /[\\\u0000-\u001f\u007f]/.test(value) || /^\/\//.test(value))
        return false
    try {
        const url = new URL(value, 'https://storefront.invalid/')
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
    } catch {
        return false
    }
}
parser.renderer.rules.image = (tokens, index, options, env, self) =>
    parser.utils.escapeHtml(self.renderInlineAsText(tokens[index].children, options, env))
const defaultLink =
    parser.renderer.rules.link_open ||
    ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))
parser.renderer.rules.link_open = (tokens, index, options, env, self) => {
    tokens[index].attrSet('rel', 'noopener noreferrer')
    return defaultLink(tokens, index, options, env, self)
}
export const renderAiMarkdown = (value) => parser.render(String(value || '').slice(0, 24000))
