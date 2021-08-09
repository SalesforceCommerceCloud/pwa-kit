```js static
// JS import
import NavMenu from 'progressive-web-sdk/dist/components/nav-menu/'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/nav/base';
```

## Example Usage

The example below demonstrates the bare minimum code needed to render the `NavMenu` component. However, you will notice that it remains non-functional (clicking the items does nothing). The examples further below will build upon this example to show more how to add functionality.

```jsx
const root = {
    title: "Phone Book",
    path: "/",
    children: [
        {title: "A", path: "/a/"},
        {title: "B", path: "/b/"},
        {title: "C", path: "/c/"}
    ]
};

<Nav root={root}>
    <NavMenu />
</Nav>
```

As is explained in full detail in the [`Nav` component's documentation](#!/Nav), functionality is introduced by passing in both an `onPathChange` callback and the current active path. Additionally we add some children items to allow further traversal, and include the [`NavHeader` component](#!/NavHeader) to allow the user to traverse the navigation tree backward:

```jsx
const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};
const root = {
    title: "Phone Book",
    path: "/",
    children: [
        {
            title: "A",
            path: "/a/",
            children: [
                {title: "Alexa", path: "/a/alexa"}
            ]
        }, {
            title: "B",
            path: "/b/",
            children: [
                {title: "Billy", path: "/a/billy"}
            ]
        }, {
            title: "C",
            path: "/c/",
            children: [
                {title: "Cassandra", path: "/a/cassandra"}
            ]
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


## Example Alternative Nav Menu Layout

While the `NavMenu` component needs to be child to the `Nav` component, it can be wrapped in HTML and moved around to suit your layout needs.

```jsx
const root = {
    title: "Header is Now A Footer!",
    path: "/",
    children: [
        {title: "A", path: "/a/"},
        {title: "B", path: "/b/"},
        {title: "C", path: "/c/"}
    ]
};

<Nav root={root}>
    <div style={{border: '1px solid #DDD'}}>
        <NavMenu />
    </div>
    <NavHeader />
</Nav>
```


## Example With Custom Animations

The `NavMenu` component controls how the navigation items animate in and out as the user traverses the navigation tree. The animation can be customized by passing in an `animationProperties` object whose valid keys and values are described in the [`NavSlider`'s prop documentation](#!/NavSlider).

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
    title: "Phone Book",
    path: "/",
    children: [
        {
            title: "A",
            path: "/a/",
            children: [
                {title: "Alexa", path: "/a/alexa"}
            ]
        }, {
            title: "B",
            path: "/b/",
            children: [
                {title: "Billy", path: "/a/billy"}
            ]
        }, {
            title: "C",
            path: "/c/",
            children: [
                {title: "Cassandra", path: "/a/cassandra"}
            ]
        }
    ]
};

/**
 * We add a `div` and give it height and width, because
 * our example of custom animation includes absolutely
 * positioning the `NavMenu`. This may or may not be
 * required for your own implementation depending on
 * your unique needs.
 */
<div style={{height: '200px', width: '100%', border: '1px solid #DDD'}}>
    <Nav
        root={root}
        path={state.path}
        onPathChange={onPathChange}
    >
        <NavHeader />
        <NavMenu animationProperties={animationProperties} />
    </Nav>
</div>
```


## Example Of Item Factory

It is common for developers to need to customize how the navigation items are rendered. This can be done using the `NavMenu` component's `itemFactory` callback.

For example:

```js static
const itemFactory = (type, props) => {
    switch(type) {
        case 'custom-1':
            return <CustomItem1 {...props} />
        case 'custom-2':
            return <CustomItem2 {...props} />
        case 'custom-3':
            return <CustomItem3 {...props} />
    }
    return <NavItem {...props} />
};
```

The callback provides two arguments: `type` and `props`. These arguments come from the `Nav` component's `root` prop object (see the [`Nav` documentation](#!/Nav) for details).

```jsx
/**
 * Example custom `NavItem`s, used in the below `itemFactory` callback.
 */
const Custom1 = ({navigate, title}) => {
    const style = {padding: '10px', backgroundColor: 'rgba(0, 0, 100, 0.15)', cursor: 'pointer'}
    return (
        <div onClick={navigate} style={style}>
            {title}
        </div>
    )
};
const Custom2 = ({navigate, title}) => {
    const style = {padding: '10px', backgroundColor: 'rgba(0, 0, 100, 0.05)', cursor: 'pointer'}
    return (
        <div onClick={navigate} style={style}>
            {title}
        </div>
    )
};
const CustomSpecial = ({navigate, title}) => {
    const style = {padding: '10px', backgroundColor: '#222', color: '#FFF', cursor: 'pointer'}
    return (
        <div onClick={navigate} style={style}>
            {title}
        </div>
    )
};

/**
 * In order to use custom navigation items, create an `itemFactory` and
 * pass it as a prop to the `NavMenu` component.
 *
 * The default factory provided creates generic `NavItem` instances.
 * We recommend using 'type' attribute to specify a custom component.
 */
const itemFactory = (type, props) => {
    switch(type) {
        case 'custom-1':
            return <Custom1 {...props} />
        case 'custom-2':
            return <Custom2 {...props} />
        case 'custom-special':
            return <CustomSpecial {...props} />
    }
    return <NavItem {...props} />
};

const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};
const root = {
    title: "Phone Book",
    path: "/",
    children: [
        {
            title: "A",
            path: "/a/",
            children: [
                {title: "Alexa", path: "/a/alexa", type: 'custom-2'}
            ],
            type: 'custom-1'
        }, {
            title: "B",
            path: "/b/",
            children: [
                {title: "Billy", path: "/a/billy", type: 'custom-2'}
            ],
            type: 'custom-1'
        }, {
            title: "C",
            path: "/c/",
            children: [
                {title: "Cassandra", path: "/a/cassandra", type: 'custom-2'}
            ],
            type: 'custom-1'
        }, {
            title: "All",
            path: "/all/",
            type: 'custom-special'
        }
    ]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavHeader />
    <NavMenu itemFactory={itemFactory} />
</Nav>
```


## A Note On SEO

In order to remain accessible to search engine crawlers, the navigation family of components is designed in a way that pre-renders a flat list version of its root object in the form of plain link tags. These tags are hidden from the user, but are available to search engine crawlers. In this way, these pre-rendered links act as a sort of sitemap.

```jsx
const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};

const root = {
    title: "Phone Book",
    path: "/",
    children: [
        {
            title: "A) Both B and C are pre-rendered as flat links",
            path: "/a/",
            children: [
                {
                    title: "B) Only A is pre-rendered a link",
                    path: "/a/b/"
                },
                {
                    title: "C) Only A is pre-rendered a link",
                    path: "/a/c/"
                },
            ]
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

You can see this for yourself by inspecting the above rendered example (or any of the example navigations) that there is one container for the active menu links, and a separate container for the hidden pre-rendered list of links. See the example markup below.

```jsx static
<div class="pw-nav">
    <div class="pw-nav-menu">
        <div class="pw-nav-slider pw-nav-menu__slider" style="...">
            <div class="pw-nav-menu__panel">
                // You will notice that in here, only the links that
                // are currently rendered in the active menu panel
                // will show in this `div`
                //
                // If you haven't clicked anything, then that should
                // be the "A" link
            </div>
        </div>
        <div class="pw-nav-menu__non-expanded-items u-visually-hidden" aria-hidden="true">
            // In here you will see that there is a flat list of links
            // which are all of the links found in the `root` object
            // are not currently rendered in active menu panel.
            //
            // If you haven't clicked anything, then that should be
            // the "B" and "C" links.
            //
            // Notice that this `div` is set to visually hidden and
            // `aria-hidden="true"`. This way no users should be able
            // to accidentally access these links.
        </div>
    </div>
</div>
```

The pre-rendered flat list of links can be turned off by setting `prerender` to false. Inspect the below example and you will see there is no `.pw-nav-menu__non-expanded-items` container:

```jsx
const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};

const root = {
    title: "Phone Book",
    path: "/",
    children: [
        {
            title: "A) Notice no pre-rendered links if inspected",
            path: "/a/",
            children: [
                {
                    title: "B) Notice no pre-rendered links if inspected",
                    path: "/a/b/"
                },
                {
                    title: "C) Notice no pre-rendered links if inspected",
                    path: "/a/c/"
                },
            ]
        }
    ]
};


<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <NavMenu prerender={false} />
</Nav>
```
