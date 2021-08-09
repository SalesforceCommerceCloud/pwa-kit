```js static
// JS import
import NavHeader from 'progressive-web-sdk/dist/components/nav-header/'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/nav/base';
```

## Example Usage

The example below demonstrates the bare minimum code needed to render the `NavHeader` component. However, you will notice that it remains non-functional (nothing changes, buttons don't do anything, etc.). The examples further below will build upon this example to show more how to add functionality.

```jsx
const root = {
    title:"Store",
    path:"/"
};

<Nav root={root}>
    <NavHeader />
</Nav>
```

This next example introduces the necessary features that give `NavHeader` the functionality to display the current route. These features are described in complete detail in the [`Nav` component's documentation](#!/Nav), but notice how by adding children to the `root` object, and introducing the `NavMenu` component that the header updates automatically as you traverse the navigation tree.

```jsx
const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};

// Notice that we added new children to the `root` so
// we can traverse the navigation tree a little deeper
const root = {
    title:"Store",
    path:"/",
    children: [{
        title:"Men's Clothing",
        path:"/mens-clothing/",
        children: [
            {title: "Jeans", path: "/mens-clothing/jeans/"},
            {title: "Polos", path: "/mens-clothing/polos/"},
            {title: "Shorts", path: "/mens-clothing/shorts/"}
        ]
    }]
};

// Notice below that we added the `NavMenu` component.
// This adds the UI that is necessary to actually
// interact with and traverse the navigation tree.
<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavHeader />
    <NavMenu />
</Nav>
```


## Example With Custom Animations

The `NavHeader` component controls how its internals (such as the `pw-nav-header__title`) element animate in and out as the user traverses the navigation tree. The animation can be customized by passing in an `animationProperties` object whose valid keys and values are described in the [`NavSlider`'s prop documentation](#!/NavSlider).

As an example:

```js static
const animationProperties = {
    className: 'pw--my-custom-animation-class',
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    id: 'my-custom-id',
};
```

```jsx
const animationProperties = {
    className: 'pw--my-custom-animation-class',
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    id: 'my-custom-id',
};

const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};
const root = {
    title:"Watch Me Bounce!",
    path:"/",
    children: [{
        title:"Animated Header!",
        path:"/animated/",
        children: [
            {title: "Click \"back\" button to see animation again", path: "/mens-clothing/jeans/"}
        ]
    }]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavHeader animationProperties={animationProperties} />
    <NavMenu />
</Nav>
```


## Example Of Using Custom Back and Close Buttons

The `startContent` and `endContent` props can be used to define custom "back" and "close" buttons! The values of these props can be text or a React node. Either way, click handlers automatically included, so if you pass in a `Button`, you don't have to add your own handler, the traversal of the navigation tree is taken care of automatically.

That said, take special care to test and ensure your implementation is accessible to keyboard and screen reader users.

```jsx
/**
 * New start and end elements to be used in the `NavHeader`
 * further down!
 */
const startContent = (<div className="u-link-color">Back?</div>);
const endContent = (
    <div className="u-link-color">
        <IconLabel label="Close" iconName="close" iconSize="" />
    </div>
);

const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};
const root = {
    title:"Store",
    path:"/",
    children: [{
        title:"Men's Clothing",
        path:"/mens-clothing/",
        children: [
            {title: "Casual Shirts", path: "/mens-clothing/casual-shirts/"},
            {title: "Coats and Jackets", path: "/mens-clothing/coats-and-jackets/"},
            {title: "Jeans", path: "/mens-clothing/jeans/"},
            {title: "Polos", path: "/mens-clothing/polos/"},
            {title: "Shorts", path: "/mens-clothing/shorts/"},
        ]
    }]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavHeader
        startContent={startContent}
        endContent={endContent}
    />
    <NavMenu />
</Nav>
```


## `onClose` Event

The `onClose` prop is available to the developer so they can hook in the ability to trigger any behavior that would like. Perhaps the most common use case is to use it to trigger a Redux action that closes the navigation if it were inside a [Sheet component](#!/Sheet)

```jsx
/**
 * This custom onClick handler can be used to, for example,
 * trigger a Redux action that closes the navigation.
 */
const onCloseHandler = () => {
    alert('Close the navigation!')
}

const root = {
    title:"Store",
    path:"/"
};

<Nav root={root}>
    <NavHeader onClose={onCloseHandler} />
</Nav>
```


## `onTitleClick` Event

The `onTitleClick` prop works in a similar way as `onClose` prop. It is triggered when a user clicks on the title.

```jsx
/**
 * This custom onTitleClick callback handler can be used to, for example,
 * trigger a Redux action that closes the navigation.
 * The callback provides two arguments: title and path.
 * These arguments come from the NavHeader component's `expanded` prop object
 */
const onTitleClickeHandler = (title, path) => {
    alert(`${title} is clicked!`)
    alert(`Current path is ${path}!`)
}

const root = {
    title:"Store",
    path:"/"
};

<Nav root={root}>
    <NavHeader onTitleClick={onTitleClickeHandler} />
</Nav>
```
