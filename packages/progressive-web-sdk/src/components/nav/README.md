```js static
// JS import
import Nav from 'progressive-web-sdk/dist/components/nav/'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/nav/base';
```

## `root` Prop

The `root` prop is an object that represents the complete navigation tree. It is passed to the `Nav` component in its entirety, even though only a small portion of it is rendered at a time. It's basic structure can be described as follows:

```js static
root = {
    title: '', // string, required
    path: '', // string, required
    type: '', // string
    children: [], // array (of root objects)
}
```

The `path` value, while just a plain string and can be more or less anything, does require `/` characters to determine what depth the navigation node is. For example, the top most node path is likely just `/`, while second level nodes are `/something/` and have two `/` characters which makes it depth 2. Third level nodes `/foo/bar/` have three `/` characters making it depth 3, and so on.

The `children` key, while optional, has a required format: it must be an array of root objects. There is no limit to the depth of this structure. Children root objects can have their own array of root objects, and so on.

See the example usages further below to see what root objects might look like.


## `onPathChange` Prop

`onPathChange` is a function callback used as a hook to trigger behavior when the navigation path changes. A navigation path change is triggered whenever a `NavItem` is interacted with. It takes four arguments:

* `path` (string) the current navigation item's path (may be modified to deduplicate non-unique paths in the Nav)
* `isLeaf` (boolean) whether the current navigation item is a leaf (see the _Example With Nested Navigation And Leafs_ section below to learn about leafs)
* `trigger` (string) the interaction that triggered the navigation to the current item. Can be one of: `mouseEnter`, `mouseLeave`, `touchEnd`, `focus`, `blur` or `click`.
* `originalPath (optional)` (string) the original, unmodified path of the current navigation item

Ultimately it's up to the developer to decide when and how route changes occur, but a common pattern would be the following:

```js static
const onPathChange = (path, isLeaf, trigger) => {
    setState({path: path}) // or equivalent Redux action
    if(isLeaf) {
        window.location.href = path
    }
};
```

The example usages further below show how to apply the callback.


## Example Usage With `NavMenu`

This example shows the bare minimum needed to render the Nav component. This example, while simple, is non-functional and not very useful by itself. Gradually more complex examples, with more useful functionality, are provided below.

Example of the `Nav` component that uses a child `NavMenu`:

```jsx
const root = {
    title: "My Store",
    path: "/",
    children: [
        {
            title: "Men's Clothing",
            path: "/mens-clothing/"
        }, {
            title: "Women's Clothing",
            path: "/womens-clothing/"
        }, {
            title: "Kid's Clothing",
            path: "/kids-clothing/"
        }, {
            title: "Accessories",
            path: "/accessories/"
        }
    ]
};

<Nav root={root}>
    <NavMenu />
</Nav>
```

## Example Usage With `MegaMenu`

This example shows the bare minimum needed to render the Nav component. This example, while simple, is non-functional and not very useful by itself. Gradually more complex examples, with more useful functionality, are provided below.

Example of the `Nav` component that uses a child `MegaMenu`

```jsx
const root = {
    title: "My Store",
    path: "/",
    children: [
        {
            title: "Men's Clothing",
            path: "/mens-clothing/"
        }, {
            title: "Women's Clothing",
            path: "/womens-clothing/"
        }, {
            title: "Kid's Clothing",
            path: "/kids-clothing/"
        }, {
            title: "Accessories",
            path: "/accessories/"
        }
    ]
};

<Nav root={root}>
    <MegaMenu />
</Nav>
```


## Example Of Enabling Route Changes

You might notice that in the example above that the component's links don't actually function at all. In order to enable the links to navigate, we must supply a callback to the `onPathChange` prop.

Also, by tracking the current active path, we can have the Nav component highlight it. This is done by passing the active path to the `path` prop.

```jsx
const onPathChange = (path) => {
    // Track the newly active path in the state so the
    // component can highlight it in the UI.
    setState({path: path})

    // You might do something like this:
    // `window.location.href = path`
    alert('Change route to ' + path + '!')
};

const root = {
    title: "My Store",
    path: "/",
    children: [
        {
            title: "Men's Clothing",
            path: "/mens-clothing/"
        }, {
            title: "Women's Clothing",
            path: "/womens-clothing/"
        }, {
            title: "Kid's Clothing",
            path: "/kids-clothing/"
        }, {
            title: "Accessories",
            path: "/accessories/"
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


## Example With Nested Navigation And Leafs

A very common navigation pattern is the nested navigation. This usually implies that the navigational structure of an app consists of multiple tiers of depth. This can be achieved with the Navigation component by passing arrays to the `children` keys in the `root` object.

By introducing children to the navigation tree, our `Nav` component inherits some new behavior: clicking on a navigation item with children will animate in a new "page" of navigation items! With this pattern, a user can narrow in on the page they want to visit very quickly.

In a nested navigation, items at the end of a navigation branch (one that has no `children`) can be thought of us a "leaf" (get it??). It's usually these leaf items that actually trigger a route change. As such, the `onPathChange` callback is passed `isLeaf` as an argument to detect whether the user clicked on one such leaf with which the developer can use to determine how they want to trigger route changes (of course, see the example below).

```jsx
const onPathChange = (path, isLeaf) => {
    // Track the newly active path in the state so the
    // component can highlight it in the UI.
    setState({path: path})

    // Only trigger a route change when the user
    // clicks a leaf!
    if (isLeaf) {
        // Typically leaf nodes cause page changes
        // in an app. You might do something like
        // this: `window.location.href = path`
        alert('Change route to ' + path + '!')
    }
};

const root = {
    title: "My Store",
    path: "/",
    children: [
        {
            title: "Men's Clothing",
            path: "/mens-clothing/",
            children: [
                {title: "Casual Shirts", path: "/mens-clothing/casual-shirts/"},
                {title: "Coats and Jackets", path: "/mens-clothing/coats-and-jackets/"},
                {title: "Jeans", path: "/mens-clothing/jeans/"},
                {title: "Polos", path: "/mens-clothing/polos/"},
                {title: "Shorts", path: "/mens-clothing/shorts/"},
            ]
        }, {
            title: "Women's Clothing",
            path: "/womens-clothing/",
            children: [
                {title: "Clothing", path: "/womens-clothing/clothing/"},
                {title: "Shoes", path: "/womens-clothing/shoes/"},
                {title: "Handbags", path: "/womens-clothing/handbags/"},
                {title: "Designer Collections", path: "/womens-clothing/designer-collections/"}
            ]
        }, {
            title: "Kid's Clothing",
            path: "/kids-clothing/",
            children:[
                {title: "Boys", path: "/kids-clothing/boys/"},
                {title: "Girls", path: "/kids-clothing/girls/"},
            ]
        }, {
            title: "Accessories",
            path: "/accessories/"
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


## Example With Nav Header and Controls

In the previous example, you might notice that it's not possible to move the navigation back to a previous page. That's because we're missing a crucial part of the navigation UI: the [`NavHeader` sub-component](#!/NavHeader)!

A common feature of the navigation component is to have a header section dedicated to displaying navigational meta data, such as the active navigation level, back and close buttons. We can achieve this by including `NavHeader` as a child to `Nav`. See the example below for the simplest (non-functional) use case. See the subsequent example for a fully functional use case.

If you wondered earlier why the `root` object's first tier included a `title` key, now you should see why: because it's used in the `NavHeader` component!

```jsx
const root = {
    title: "My Store",
    path: "/",
    children: [
        {
            title: "Men's Clothing",
            path: "/mens-clothing/"
        }, {
            title: "Women's Clothing",
            path: "/womens-clothing/"
        }, {
            title: "Kid's Clothing",
            path: "/kids-clothing/"
        }, {
            title: "Accessories",
            path: "/accessories/"
        }
    ]
};

<Nav root={root}>
    <NavHeader />
    <NavMenu />
</Nav>
```


To see the fully functional example of the NavHeader below:

```jsx
const onPathChange = (path, isLeaf) => {
    // Track the newly active path in the state so the
    // component can highlight it in the UI.
    setState({path: path})

    // Only trigger a route change when the user
    // clicks a leaf!
    if (isLeaf) {
        // Typically leaf nodes cause page changes
        // in an app. You might do something like
        // this: `window.location.href = path`
        alert('Change route to ' + path + '!')
    }
};

const root = {
    title: "My Store",
    path: "/",
    children: [
        {
            title: "Men's Clothing",
            path: "/mens-clothing/",
            children: [
                {title: "Casual Shirts", path: "/mens-clothing/casual-shirts/"},
                {title: "Coats and Jackets", path: "/mens-clothing/coats-and-jackets/"},
                {title: "Jeans", path: "/mens-clothing/jeans/"},
                {title: "Polos", path: "/mens-clothing/polos/"},
                {title: "Shorts", path: "/mens-clothing/shorts/"},
            ]
        }, {
            title: "Women's Clothing",
            path: "/womens-clothing/",
            children: [
                {title: "Clothing", path: "/womens-clothing/clothing/"},
                {title: "Shoes", path: "/womens-clothing/shoes/"},
                {title: "Handbags", path: "/womens-clothing/handbags/"},
                {title: "Designer Collections", path: "/womens-clothing/designer-collections/"}
            ]
        }, {
            title: "Kid's Clothing",
            path: "/kids-clothing/",
            children:[
                {title: "Boys", path: "/kids-clothing/boys/"},
                {title: "Girls", path: "/kids-clothing/girls/"},
            ]
        }, {
            title: "Accessories",
            path: "/accessories/"
        }
    ]
};

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

To customize how the Nav component animates as it transitions from page to page, you can pass custom configurations to the `NavHeader` and/or the `NavMenu` components' prop called `animationProperties`. See either the [`NavHeader`](#!/NavHeader) or [`NavMenu`](#!/NavMenu) for details.


## Example With The Item Factory

It is common for developers to need to customize how the navigation items are rendered. This can be done using the `NavMenu` component's `itemFactory` callback. For examples of this, see the [`NavMenu` component](#!/NavMenu) for details.


## Complex Example

Below is an example that takes everything discussed above to create a single, complex use case. As mentioned above, see either the [`NavHeader`](#!/NavHeader) or [`NavMenu`](#!/NavMenu) for details on the item factory and custom animations.

```jsx
const initialState = {path: '/'};

const onPathChange = (path, isLeaf) => {
    setState({path: path})
    if(isLeaf) {
        // Typically leaf nodes cause page changes in an
        // app. You might do something like this:
        // window.location.href = path
    }
};

const root = {title:"Store", path:"/", children:[
    {title:"Men's Clothing", path:"/mens-clothing/", children:[
        {title:"Casual Shirts", path:"/mens-clothing/casual-shirts/"},
        {title:"Coats and Jackets", path:"/mens-clothing/coats-and-jackets/"},
        {title:"Jeans", path:"/mens-clothing/jeans/"},
        {title:"Polos", path:"/mens-clothing/polos/"},
        {title:"Shorts", path:"/mens-clothing/shorts/"},
    ]},
    {title:"Women's Clothing", path:"/womens-clothing/", children:[
        {title:"Clothing", path:"/womens-clothing/clothing/"},
        {title:"Shoes", path:"/womens-clothing/shoes/"},
        {title:"Handbags", path:"/womens-clothing/handbags/"},
        {title:"Designer Collections", path:"/womens-clothing/designer-collections/"}
    ]},
    {title:"Kid's Clothing", path:"/kids-clothing/", children:[
        {title:"Boys", path:"/kids-clothing/boys/"},
        {title:"Girls", path:"/kids-clothing/girls/"},
    ]},
    {title:"Footwear", path:"/footwear/"},
    {title:"Accessories", path:"/accessories/"},
    {title:"For the Home", path:"/for-the-home/"},
    {title:"My Account", path:"/my-account/", type: "custom"},
    {title:"Wish List", path:"/wish-list/", type: "custom"},
    {title:"Gift Registry", path:"/gift-registry/", type: "custom"},
]};

/**
 * Example custom navigation item, used in the below
 * `itemFactory` callback. More details on the
 * `itemFactory` can be found in the `NavHeader` and
 * `NavMenu` documentation.
 */
const Custom = (props) => {
    const {navigate, selected, title, children, hasChild} = props
    const style = {padding: '10px', backgroundColor: '#222', color: '#FFF', cursor: 'pointer'}
    return (
        <div onClick={navigate} style={style}>
            {title}
        </div>
    )
};

/**
 * In order to use custom navigation items, create an
 * `itemFactory` and pass it as a prop to the `NavMenu`
 * component.
 *
 * The default factory provided creates generic
 * `NavItem` instances. We recommend using 'type'
 * attribute to specify a custom component.
 */
const itemFactory = (type, props) => {
    if (type === 'custom') {
        return <Custom {...props} />
    } else {
        const icon = <Icon name="chevron-right" />
        return <NavItem {...props} childIcon={icon} />
    }
};

/**
 * Custom animation! This is explained in further detail
 * in the documentation for the `NavHeader` and
 * `NavMenu` components
 */
const animationProperties = {
    duration: 400,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

/**
 * We add a `div` and give it height and width, because
 * our example of custom animation includes absolutely
 * positioning the `NavMenu` and `NavHeader`. This may
 * or may not be required for your own implementation
 * depending on your unique needs.
 */
<div style={{height: '440px', width: '100%', border: '1px solid #DDD'}}>
    <Nav
        root={root}
        path={state.path}
        onPathChange={onPathChange}
    >
        <NavHeader animationProperties={animationProperties} />
        <NavMenu
            itemFactory={itemFactory}
            animationProperties={animationProperties}
        />
    </Nav>
</div>
```


## Duplicate Paths

The Nav component was originally designed to render a navigation tree in which
every item contained a unique path or URL. We've upgraded the Nav to handle
cases where users want to include items with duplicate paths in the same menu.
The Nav does this by automatically de-duplicating paths on the items you pass it.


### Path modification for duplicate paths

If the navigation tree contains nodes with duplicate paths, paths are modified by appending '#'s to the end of the path. For example, consider the following navigation tree:

```js static
const root = {
    title: 'My Store',
    path: '/',
    children: [
        {title: 'child1', path: '/child/'},
        {title: 'child2', path: '/child/'},
        {title: 'child3', path: '/child/'}
    ]
}
```

All the children of the 'root' element in the above navigation tree are same. Hence, their paths will be deduplicated as:
- path of root: '/'
- path of child1: '/child/'
- path of child2: '/child/#'
- path of child3: '/child/##'


### Handling warnings relating to "duplicate paths in the Nav"

If you are using duplicate paths in your navigation system, you might see a warning something like:
`Your Nav contains duplicate paths. Make sure you change your onPathChange callback to use originalPath when changing routes. See https://docs.mobify.com/progressive-web/latest/components/#!/Nav`

If you see a warning relating to duplicate paths (like above), you'll need to upgrade your onPathChange function to take a fourth parameter containing the original, unmodified path, like this:

```jsx
const onPathChange = (path, isLeaf, trigger, originalPath) => {

    // Use the de-duplicated path for the Nav state
    setState({path: path})

    // Use the additional parameter (originalPath) when changing Routes
    // instead of 'path' parameter (altered due to deduplication)
    if (isLeaf) {
        alert('Change route to ' + originalPath + '!')
    }
}

// All the children of root node have the same path
const root = {
    title: 'My Store',
    path: '/',
    children: [
        {title: 'child1', path: '/child/'},
        {title: 'child2', path: '/child/'},
        {title: 'child3', path: '/child/'}
    ]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavHeader />
    <NavMenu />
</Nav>


```

If a navigation tree that has duplicate paths is passed into the 'Nav' component without using the modified onPathChange callback, then the 'path' that you would get from the onPathChange callback would be the deduplicated path (path appended with #s)
