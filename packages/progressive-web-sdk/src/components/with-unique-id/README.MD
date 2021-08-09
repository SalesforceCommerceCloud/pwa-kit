Higher order component that provides a unique id prop that is safe for use with
client and server side rendered components.

```js static
// JS import
import withUniqueId from 'progressive-web-sdk/dist/components/with-unique-id'
```

## Example Usage

```js static
class ComponentWithUniqueId extends React.Component {
    componentDidMount() {
        // ...
    }

    render() {
        // ...
    }
}

const WrappedComponentWithUniqueId = withUniqueId(ComponentWithUniqueId)
```
