/** @jsx jsx */
import {jsx} from 'theme-ui'
import * as React from 'react'
import Highlight, {defaultProps} from 'prism-react-renderer'
import prismTheme from '../styles/prismMobifyDark'
import {LiveProvider, LiveEditor, LiveError, LivePreview} from 'react-live'
import {CopyToClipboard} from 'react-copy-to-clipboard'
import {useMDXScope} from 'gatsby-plugin-mdx/context'
import SpriteSheet from './SpriteSheet'
import ButtonCopyToClipboard from '../components/ButtonCopyToClipboard'
import styled from '@emotion/styled'
import mediaqueries from '../styles/media'
const ReduxForm = require('redux-form')
const Redux = require('redux')
const ReactRedux = require('react-redux')

/** Removes the last token from a code example if it's empty. */
function cleanTokens(tokens) {
    const tokensLength = tokens.length
    if (tokensLength === 0) {
        return tokens
    }
    const lastToken = tokens[tokensLength - 1]
    if (lastToken.length === 1 && lastToken[0].empty) {
        return tokens.slice(0, tokensLength - 1)
    }
    return tokens
}

/** Parse the language provided in the fenced code block that is included in the className prop
    Example className string: 'language-json css0'
    Parsed language string: 'json'
    Supported language strings: https://github.com/FormidableLabs/prism-react-renderer/blob/master/src/vendor/prism/includeLangs.js
 */
function getLanguageFromClassName(className) {
    const languageRegex = /language-(.*) /
    const languageMatch = className.match(languageRegex)
    const language =
        languageMatch !== null && languageMatch.length > 1 && languageMatch[1] != ''
            ? languageMatch[1]
            : ''
    return language
}

const Wrapper = ({children, className}) => (
    <SDKComponentWrapper
        className={`sdk-base ${className}`}
        sx={{backgroundColor: 'lightSilver', color: 'text', padding: 'sm', whiteSpace: 'normal'}}
    >
        <div className="rsg--preview">
            <span
                style={{display: 'none'}}
                dangerouslySetInnerHTML={{
                    __html: SpriteSheet
                }}
            />
            {children}
        </div>
    </SDKComponentWrapper>
)

const SDKComponentWrapper = styled.div`
    &.sdk-base [class*='rsg--preview'] select[disabled],
    &.sdk-base [class*='rsg--preview'] select[readonly],
    &.sdk-base [class*='rsg--preview'] textarea[disabled],
    &.sdk-base [class*='rsg--preview'] textarea[readonly],
    &.sdk-base [class*='rsg--preview'] [type='text'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='text'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='search'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='search'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='password'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='password'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='tel'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='tel'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='url'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='url'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='number'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='number'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='email'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='email'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='checkbox'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='checkbox'][readonly],
    &.sdk-base [class*='rsg--preview'] [type='radio'][disabled],
    &.sdk-base [class*='rsg--preview'] [type='radio'][readonly] {
        background: ${(p) => p.theme.colors.mediumSilver};
    }

    &.redux-wrapper h3 {
        border-top: 0;
        padding-top: 0;
    }
`

/* eslint-disable react/jsx-key */
const CodeBlockInner = ({children: exampleCode, ...props}) => {
    const components = useMDXScope()
    const language = getLanguageFromClassName(props.className)

    if (props['redux']) {
        const scope = {
            ReactRedux,
            Redux,
            ...components,
            ReduxForm
        }
        const noInlineExample = exampleCode.trim()
        return (
            <div
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                <Wrapper className="redux-wrapper">
                    <LiveProvider code={noInlineExample} noInline={true} scope={scope}>
                        <LivePreview component={Wrapper} />
                        <LiveEditor preclassname="code-block-pre" padding={20} />
                        <LiveError />
                    </LiveProvider>
                </Wrapper>
            </div>
        )
    }
    if (props['react-live']) {
        return (
            <div
                onClick={(e) => {
                    e.stopPropagation()
                }}
            >
                <LiveProvider
                    code={exampleCode}
                    scope={components}
                    language={language}
                    theme={prismTheme}
                >
                    <LivePreview Component={Wrapper} />
                    <CopyToClipboard text={exampleCode}>
                        <ButtonCopyToClipboard>Copy</ButtonCopyToClipboard>
                    </CopyToClipboard>
                    <LiveEditor preclassname="code-block-pre" padding={20} />
                    <LiveError />
                </LiveProvider>
            </div>
        )
    } else {
        return (
            <PreContent>
                <CopyToClipboard text={exampleCode}>
                    <ButtonCopyToClipboard title={props.title}>Copy</ButtonCopyToClipboard>
                </CopyToClipboard>
                <Highlight
                    {...defaultProps}
                    code={exampleCode}
                    language={language}
                    theme={prismTheme}
                >
                    {({tokens, getLineProps, getTokenProps}) => (
                        <pre
                            sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'medium',
                                padding: 'lg',
                                backgroundColor: 'black',
                                margin: 'zero'
                            }}
                        >
                            {cleanTokens(tokens).map((line, i) => {
                                let lineClass = {}
                                let isDiff = false
                                if (
                                    line[0] &&
                                    line[0].content.length &&
                                    line[0].content[0] === '+'
                                ) {
                                    lineClass = {backgroundColor: 'red'}
                                    isDiff = true
                                } else if (
                                    line[0] &&
                                    line[0].content.length &&
                                    line[0].content[0] === '-'
                                ) {
                                    lineClass = {backgroundColor: 'blue'}
                                    isDiff = true
                                } else if (
                                    line[0] &&
                                    line[0].content === '' &&
                                    line[1] &&
                                    line[1].content === '+'
                                ) {
                                    lineClass = {backgroundColor: 'red'}
                                    isDiff = true
                                } else if (
                                    line[0] &&
                                    line[0].content === '' &&
                                    line[1] &&
                                    line[1].content === '-'
                                ) {
                                    lineClass = {backgroundColor: 'blue'}
                                    isDiff = true
                                }
                                const lineProps = getLineProps({line, key: i})
                                lineProps.style = lineClass
                                const diffStyle = {
                                    userSelect: 'none',
                                    MozUserSelect: '-moz-none',
                                    WebkitUserSelect: 'none'
                                }
                                let splitToken
                                return (
                                    <div {...lineProps}>
                                        {line.map((token, key) => {
                                            if (isDiff) {
                                                if (
                                                    (key === 0 || key === 1) &&
                                                    (token.content.charAt(0) === '+' ||
                                                        token.content.charAt(0) === '-')
                                                ) {
                                                    if (token.content.length > 1) {
                                                        splitToken = {
                                                            types: ['template-string', 'string'],
                                                            content: token.content.slice(1)
                                                        }
                                                        const firstChar = {
                                                            types: ['operator'],
                                                            content: token.content.charAt(0)
                                                        }
                                                        return (
                                                            <React.Fragment>
                                                                <span
                                                                    {...getTokenProps({
                                                                        token: firstChar,
                                                                        key
                                                                    })}
                                                                    style={diffStyle}
                                                                />
                                                                <span
                                                                    {...getTokenProps({
                                                                        token: splitToken,
                                                                        key
                                                                    })}
                                                                />
                                                            </React.Fragment>
                                                        )
                                                    } else {
                                                        return (
                                                            <span
                                                                {...getTokenProps({token, key})}
                                                                style={diffStyle}
                                                            />
                                                        )
                                                    }
                                                }
                                            }
                                            return <span {...getTokenProps({token, key})} />
                                        })}
                                    </div>
                                )
                            })}
                        </pre>
                    )}
                </Highlight>
            </PreContent>
        )
    }
}

const PreContent = styled.div`
    display: table;
    width: 100%;
    ${(p) => mediaqueries.phablet`
        font-size: ${p.theme.fontSizes[0] / 1.2}px; // 10px
    `}
`
export default CodeBlockInner
