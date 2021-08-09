```js static
// JS import
import MegaMenuItem from 'progressive-web-sdk/dist/components/mega-menu'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/mega-menu-item/base';
```


## Example usage

The most simple way to use the `MegaMenuItem` is to pass it `content`

```jsx
<MegaMenuItem content="Home page" />
```


## Example with `href`

This prop can be used to render `MegaMenuItem` as a link.

```jsx
<MegaMenuItem content="Home page" href="/" />
```


## Example with `children`

Passing `children` to the `MegaMenuItem` component (usually other instances of `MegaMenuItem`), it will render them after the `content`.

```jsx
<MegaMenuItem content="Parent Item">
    <MegaMenuItem content="Child Item 1" />
    <MegaMenuItem content="Child Item 2" />
    <MegaMenuItem content="Child Item 3" />
</MegaMenuItem>
```


## Example with `afterContent`

```jsx
<div>
    <MegaMenuItem
        content="Parent Item"
        afterContent={<Icon name="chevron-right" />}
    />

    <MegaMenuItem
        content="Parent Item"
        afterContent={<Icon name="chevron-right" />}
    />
</div>
```


## Example with `beforeContent`

```jsx
<div>
    <MegaMenuItem
        content="Parent Item"
        beforeContent={<Icon name="user" />}
    />

    <MegaMenuItem
        content="Parent Item"
        beforeContent={<Icon name="search" />}
    />
</div>
```


## Example with `navigate`

The `navigate` prop is an event handler (for `click`, `mouseEnter`, `mouseLeave`, and `focus` events) that invokes the `Nav` component's `onPathChange` callback. When a 'MegaMenu' renders its `MegaMenuItem`s, it automatically passes a hander to the `navigate` prop. So while it is possible to manually define `navigate` handlers, it is not recommended.

```jsx
<MegaMenuItem
    content="Parent Item"
    navigate={(eventName) => { console.log(`triggered: custom handler for ${eventName} event`) }}
/>
```

Instead, understand that `navigate` is passed a value from `MegaMenu` automatically. See the example below.

_(Notice that in the below example, it appears as if there are **no** instances of `MegaMenuItem`, but in fact they are automatically rendered by `MegaMenu`)_

```jsx
const initialState = {path: '/'};
const onPathChange = (path) => {
    console.log('This callback is invoked when navigate() gets called!')
    setState({path: path})
};
const root = {
    title: "Demonstration",
    path: "/",
    children: [
        {
            title: "Activating triggers navigate and sets path",
            path: "/a/"
        }, {
            title: "Activating triggers navigate and sets path",
            path: "/b/"
        }, {
            title: "Activating triggers navigate and sets path",
            path: "/c/"
        }
    ]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <MegaMenu />
</Nav>
```


## Rendering custom `MegaMenuItem`s in `MegaMenu`

If you want to use your own custom `MegaMenuItem`, you can do so by utilizing the `MegaMenu`'s `itemFactory` callback. Refer to the [MegaMenu's documentation](#!/MegaMenu) for details.
