import React from 'react'
import PropTypes from 'prop-types'
import Group from 'react-group'
import objectToString from 'javascript-stringify'
import Arguments from 'react-styleguidist/lib/rsg-components/Arguments'
import Argument from 'react-styleguidist/lib/rsg-components/Argument'
import Code from 'react-styleguidist/lib/rsg-components/Code'
import JsDoc from 'react-styleguidist/lib/rsg-components/JsDoc'
import Markdown from 'react-styleguidist/lib/rsg-components/Markdown'
import Name from 'react-styleguidist/lib/rsg-components/Name'
import Type from 'react-styleguidist/lib/rsg-components/Type'
import Text from 'react-styleguidist/lib/rsg-components/Text'
import Para from 'react-styleguidist/lib/rsg-components/Para'
import Table from 'react-styleguidist/lib/rsg-components/Table'
import map from 'lodash.map'
import {unquote, getType, showSpaces} from 'react-styleguidist/lib/rsg-components/Props/util'

// eslint-disable-next-line func-style
function renderType(type) {
    if (!type) {
        return 'unknown'
    }

    const {name} = type

    switch (name) {
        case 'arrayOf':
            return `${type.value.name}[]`
        case 'objectOf':
            return `{${renderType(type.value)}}`
        case 'instanceOf':
            return type.value
        default:
            return name
    }
}

// eslint-disable-next-line func-style
function renderEnum(prop) {
    if (!Array.isArray(getType(prop).value)) {
        return <span>{getType(prop).value}</span>
    }

    const values = getType(prop).value.map(({value}) => (
        <Code key={value}>{showSpaces(unquote(value))}</Code>
    ))
    return (
        <span>
            One of:{' '}
            <Group separator=", " inline>
                {values}
            </Group>
        </span>
    )
}

// eslint-disable-next-line func-style
function renderShape(props) {
    const rows = []
    for (const name in props) {
        // eslint-disable-line guard-for-in
        const prop = props[name]
        const defaultValue = renderDefault(prop) // eslint-disable-line no-use-before-define
        const description = prop.description
        rows.push(
            <div key={name}>
                <Name>{name}</Name>
                {': '}
                <Type>{renderType(prop)}</Type>
                {defaultValue && ' — '}
                {defaultValue}
                {description && ' — '}
                {description && <Markdown text={description} inline />}
            </div>
        )
    }
    return rows
}

const defaultValueBlacklist = ['null', 'undefined']

// eslint-disable-next-line func-style
function renderDefault(prop) {
    if (prop.required) {
        return (
            <Text size="small" color="light">
                Required
            </Text>
        )
    } else if (prop.defaultValue) {
        if (prop.type) {
            const propName = prop.type.name

            if (defaultValueBlacklist.indexOf(prop.defaultValue.value) > -1) {
                return <Code>{showSpaces(unquote(prop.defaultValue.value))}</Code>
            } else if (propName === 'func') {
                return (
                    <Text
                        size="small"
                        color="light"
                        underlined
                        title={showSpaces(unquote(prop.defaultValue.value))}
                    >
                        Function
                    </Text>
                )
            } else if (propName === 'shape' || propName === 'object') {
                try {
                    // We eval source code to be able to format the defaultProp here. This
                    // can be considered safe, as it is the source code that is evaled,
                    // which is from a known source and safe by default
                    // eslint-disable-next-line no-eval
                    const object = eval(`(${prop.defaultValue.value})`)
                    return (
                        <Text
                            size="small"
                            color="light"
                            underlined
                            title={objectToString(object, null, 2)}
                        >
                            Shape
                        </Text>
                    )
                } catch (e) {
                    // eval will throw if it contains a reference to a property not in the
                    // local scope. To avoid any breakage we fall back to rendering the
                    // prop without any formatting
                    return (
                        <Text size="small" color="light" underlined title={prop.defaultValue.value}>
                            Shape
                        </Text>
                    )
                }
            }
        }

        return <Code>{showSpaces(unquote(prop.defaultValue.value))}</Code>
    }
    return ''
}

// eslint-disable-next-line func-style
function renderDescription(prop) {
    const {description, tags = {}} = prop
    const extra = renderExtra(prop) // eslint-disable-line no-use-before-define
    const args = [...(tags.arg || []), ...(tags.argument || []), ...(tags.param || [])]
    const returnDocumentation = (tags.return && tags.return[0]) || (tags.returns && tags.returns[0])

    return (
        <div>
            {description && <Markdown text={description} />}
            {extra && <Para>{extra}</Para>}
            <JsDoc {...tags} />
            {args.length > 0 && <Arguments args={args} heading />}
            {returnDocumentation && <Argument {...returnDocumentation} returns />}
        </div>
    )
}

// eslint-disable-next-line func-style
function renderExtra(prop) {
    const type = getType(prop)

    if (!type) {
        return null
    }
    switch (type.name) {
        case 'enum':
            return renderEnum(prop)
        case 'union':
            return renderUnion(prop) // eslint-disable-line no-use-before-define
        case 'shape':
            return renderShape(prop.type.value)
        case 'arrayOf':
            if (type.value.name === 'shape') {
                return renderShape(prop.type.value.value)
            }
            return null
        case 'objectOf':
            if (type.value.name === 'shape') {
                return renderShape(prop.type.value.value)
            }
            return null
        default:
            return null
    }
}

// eslint-disable-next-line func-style
function renderUnion(prop) {
    if (!Array.isArray(getType(prop).value)) {
        return <span>{getType(prop).value}</span>
    }

    const values = getType(prop).value.map((value, index) => (
        <Type key={`${value.name}-${index}`}>{renderType(value)}</Type>
    ))
    return (
        <span>
            One of type:{' '}
            <Group separator=", " inline>
                {values}
            </Group>
        </span>
    )
}

// eslint-disable-next-line func-style
function renderName(prop) {
    const {name, tags = {}} = prop
    return (
        <div>
            <Name deprecated={!!tags.deprecated}>{name}</Name>
            <div>{renderDescription(prop)}</div>
        </div>
    )
}

// eslint-disable-next-line func-style
function renderTypeColumn(prop) {
    return <Type>{renderType(getType(prop))}</Type>
}

// eslint-disable-next-line func-style
export function getRowKey(row) {
    return row.name
}

// eslint-disable-next-line func-style
export function propsToArray(props) {
    return map(props, (prop, name) => ({...prop, name}))
}

export const columns = [
    {
        caption: 'Prop name',
        render: renderName
    },
    {
        caption: 'Type',
        render: renderTypeColumn
    },
    {
        caption: 'Default',
        render: renderDefault
    }
]

export default function PropsRenderer({props}) {
    return <Table columns={columns} rows={propsToArray(props)} getRowKey={getRowKey} />
}

PropsRenderer.propTypes = {
    props: PropTypes.object.isRequired
}
