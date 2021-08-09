```js static
// JS import
import Split from 'progressive-web-sdk/dist/components/split/'
```

## Purpose

Displays children if cookie value requirement is met or adds `splitValue` props to your component.

The Split component helps surface cookie values into props of other React components. This
component is subscribed to the Cookie Manager so that when there is an update
to the value of the cookie, it will propagate the value of the cookie to the
children of this component.

## Example Usages

### Bind `splitValue` props to children of `Split`

```jsx static
<Split splitCookieName="split-cookie-name" defaultSplitValue="A">
    <ComponentA />
    <ComponentB />
</Split>
```

The example above gives both `ComponentA` and `ComponentB` a new `splitValue` props
that will contain the cookie value of `split-cookie-name`.

If the `defaultSplitValue` attribute is defined, `splitValue` will be equal to `defaultSplitValue`
when the specified cookie is not defined.

If the `defaultSplitValue` attribute is not defined,
`splitValue` will be equal to `null`

### Show children based on cookie value

```jsx
<Split splitCookieName="split-cookie-name" showOnVariant="A">
    <div>Test A</div>
</Split>
```

The example above will only render the children if the cookie value of
`split-cookie-name` is exactly `A`.

### Show children if the cookie is not defined

```jsx
<Split splitCookieName="split-cookie-name" showOnVariant="null">
    <div>Test null</div>
</Split>
```

The example above will only render the children if `split-cookie-name` cookie is
not defined. This is useful when you need to define a skeleton state when there
is an anticipated delay of when the cookie will be set.

## Template Split

If you require `Split` at the container level, follow these instructions for setup
and usage.

### Setup

Modify `web/app/template.jsx`

```jsx static
import Split from 'progressive-web-sdk/dist/components/split/'
...
const template = (WrappedComponent, options) => {
    ...
    render() {
        return React.createElement(
            Split,
            options,
            React.createElement(WrappedComponent, this.props)
        )
    }
}
```

### Example Usage

To obtain the cookie value, add the following to your template container file.

```jsx static
...
ProductList.propTypes = {
    ...
    splitValue: PropTypes.string
}

export default template(ProductList, {
    splitCookieName: 'split-cookie-name',
    defaultSplitValue: 'A'  // Optional
})
```
