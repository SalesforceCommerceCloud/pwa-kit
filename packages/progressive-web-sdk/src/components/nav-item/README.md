```js static
// JS import
import NavItem from 'progressive-web-sdk/dist/components/nav-item'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/nav-item/base';
```


## Example Usage

The most simple way to use the `NavItem` component is as seen below.

```jsx
<NavItem title="Home page" />
```


## Example With `href` prop

This prop can be used to render `NavItem` as a link.

```jsx
<NavItem title="Home page" href="http://www.mobify.com" />
```


## Example With `hasChild` Prop

Part of the `NavItem`'s job is to communicate its relationship within an overall navigation tree. For example, is the `NavItem` itself a "leaf" of the tree (has no children and is probably a link), or does it branch into more links (has children and is probably not a link). Below demonstrates the `NavLink` when `hasChild` is `true` and `false`:

```jsx
<div>
    <NavItem
        title="Has children, and thus has a chevron!"
        hasChild={true}
    />

    <NavItem
        title="No children, and thus no chevron"
    />
</div>
```


## Example With `childIcon` Prop

The developer or designer might want to swap the `NavItem`'s default `childIcon` from just a standard '>' character to something more interesting, such as an SVG icon:

```jsx
<NavItem
    title="Has custom `childIcon`"
    hasChild={true}
    childIcon={<Icon name="chevron-right" />}
/>
```


## Example With `beforeContent` Prop

A simple way to customize the `NavItem` is to supply content to the `beforeContent` prop, such as icons or images. For example:

```jsx
<div>
    <NavItem
        title="My Profile"
        beforeContent={<Icon name="user" />}
    />

    <NavItem
        title="Search"
        beforeContent={<Icon name="search" />}
    />
</div>
```


## Example With `content` Prop

This prop can be used to override the default label.

```jsx
<div>
    <NavItem
        title="This should be overridden"
        content="The custom content is visible, but not the title!"
    />

    <NavItem
        title="This should be overridden"
        content="But other props won't be overridden"
        beforeContent={<Icon name="caution" />}
        childIcon={<Icon name="caution" />}
        hasChild={true}
    />
</div>
```


## Example With `navigate` and `selected` Props

The `navigate` prop is an `onClick` handler that invokes the `Nav` component's `onPathChange` callback. When a 'NavMenu' renders its `NavItem`s, it automatically passes a hander to the `navigate` prop.

The `selected` prop is just a boolean that determines whether the item is "active", and is also supplied by the parent `NavMenu`.

Therefore, while it is possible to use both `navigate` and `selected`, it is not recommended.

```jsx
<div>
    <NavItem
        title="This custom click handler is not recommended"
        navigate={() => { alert('triggered: custom click handler') }}
    />

    <NavItem
        title="This item is selected, or 'active'"
        selected={true}
    />
</div>
```

Instead, understand that `navigate` and `selected` are passed values from `NavMenu` automatically. See the example below...

_(Notice that in the below example, it appears as if there are **no** instances of `NavItem`, but in fact they are automatically rendered by `NavMenu`)_

```jsx
const initialState = {path: '/'};
const onPathChange = (path) => {
    window.alert('This callback is invoked when navigate() gets called!')
    setState({path: path})
};
const root = {
    title: "Demonstration",
    path: "/",
    children: [
        {
            title: "Clicking triggers navigate and enables selected",
            path: "/a/"
        }, {
            title: "Clicking triggers navigate and enables selected",
            path: "/b/"
        }, {
            title: "Clicking triggers navigate and enables selected",
            path: "/c/"
        }
    ]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavMenu />
</Nav>
```


## Rendering Custom `NavItem`s in `NavMenu`

If you want to use your own custom `NavItem`s, you can do so by utilizing the `NavMenu`'s `itemFactory` callback. Refer to [`NavMenu`'s documentation'](#!/NavMenu) for details.
