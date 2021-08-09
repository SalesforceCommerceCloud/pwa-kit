```js static
// JS import
import List from 'progressive-web-sdk/dist/components/list'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/list/base';
```


## Example Usage

```jsx
<List>
    <ListTile>I am a ListTile</ListTile>
    <ListTile>I am a ListTile</ListTile>
</List>
```


## Example With `items`

Using the `items` prop, you can pass an array of objects than can be parsed into
individual items.

```jsx
<List
    items={[
        {
            title: "Hear me roar!"
        },
        {
            title: "Foobar"
        },
        {
            title: "Quotes and stuff"
        },
        {         
            title: "Lorem ipsum"
        }
    ]}
/>
```


## Example With `component`

By default, each item in the `items` array will be parsed as a `ListTile`
component. This can be customized by passing a different component
into the `component` prop.

```jsx
<List component={Button}
    items={[
        {
            text: "Hear me roar!"
        },
        {         
            text: "Lorem ipsum",
            href: '#'
        }
    ]}
/>
```
