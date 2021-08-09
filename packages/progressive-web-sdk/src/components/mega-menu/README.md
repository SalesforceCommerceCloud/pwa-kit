```js static
// JS import
import MegaMenu from 'progressive-web-sdk/dist/components/mega-menu'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/mega-menu/base';
```


## Example Usage

The example below demonstrates the bare minimum code needed to render the MegaMenu component. However, you will notice that it remains non-functional (clicking the items does nothing). The examples further below will build upon this example to show more how to add functionality.

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
    <MegaMenu />
</Nav>
```

As is explained in full detail in the [`Nav` component's documentation](#!/Nav), functionality is introduced by passing in both an `onPathChange` callback and the current active path. Additionally we add some children items to allow further traversal:

```jsx
const onPathChange = (path, isLeaf, trigger) => {
    // Track the newly active path in the state so the
    // component can highlight it in the UI.
    setState({path: path})

    // Only "navigate" anywhere if the trigger was a click!
    if (trigger === 'click') {
        // You might do something like this for leafs:
        // `window.location.href = path`
        window.alert('Navigate to ' + path)
    }
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
    <MegaMenu />
</Nav>
```


## Example Of Item Factory

It is common for developers to need to customize how the navigation items are rendered. This can be done using the `MegaMenu` component's itemFactory callback.

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
    return <MegaMenuItem {...props} />
};
```

The callback provides two arguments: type and props. These arguments come from the Nav component's root prop object (see the [Nav documentation](#!/Nav) for details).

```jsx
/**
 * Example custom `MegaMenuItem`s, used in the below `itemFactory` callback
 */
const CustomMegaMenuItem = (props) => {
    const column1Keys = ['0.0.0', '0.0.1', '0.0.2', '0.0.3']
    const column2Keys = ['0.0.4', '0.0.5']
    const column3Keys = ['0.0.6']
    const column4Keys = ['0.0.7', '0.0.8']

    const filteredChildren = (keys) => {
        return props.children.filter((child) => keys.indexOf(child.key) >= 0)
    }

    const column1 = filteredChildren(column1Keys)
    const column2 = filteredChildren(column2Keys)
    const column3 = filteredChildren(column3Keys)
    const column4 = filteredChildren(column4Keys)

    return (
        <MegaMenuItem {...props}>
            <div className="u-flex">
                {column1}
            </div>

            <div className="u-flex">
                {column2}
            </div>

            <div className="u-flex">
                {column3}
            </div>

            <div className="u-flex">
                {column4}
            </div>
        </MegaMenuItem>
    )
};

/**
 * In order to use custom navigation items, create an `itemFactory` and
 * pass it as a prop to the `MegaMenu` component.
 *
 * The default factory provided creates generic `MegaMenuItem` instances.
 * We recommend using 'type' attribute to specify a custom component.
 */
const itemFactory = (type, props) => {
    if (type === 'custom-type') {
        return <CustomMegaMenuItem {...props} />
    }

    return <MegaMenuItem {...props} />
};

const onPathChange = (path, isLeaf, trigger) => {
    // Track the newly active path in the state so the
    // component can highlight it in the UI.
    setState({path: path})

    // Only "navigate" anywhere if the trigger was a click!
    if (trigger === 'click') {
        // You might do something like this for leafs:
        // `window.location.href = path`
        window.alert('Navigate to ' + path)
    }
};

const root = {
    title: "My Example Store",
    path: "/",
    children: [
        {
            title: 'Category 1',
            path: '/category-1/',
            type: 'custom-type',
            children: [
                {title: 'Go to Category 1 home', path: '/category-1/home/'},
                {title: 'New Arrivals', path: '/category-1/new/'},
                {title: 'On Sale', path: '/category-1/sale/'},
                {title: 'Winter Warmers', path: '/category-1/winter/'},
                {
                    title: 'Subcategory',
                    path: '/category-1/sub-1/',
                    children: [
                        {title: 'Product list', path: '/category-1/sub-1/prod-1/'},
                        {title: 'Product list', path: '/category-1/sub-1/prod-2/'},
                        {title: 'Product list', path: '/category-1/sub-1/prod-3/'}
                    ]
                },
                {
                    title: 'Subcategory',
                    path: '/category-1/sub-2/',
                    children: [
                        {title: 'Product list', path: '/category-1/sub-2/prod-1/'},
                        {title: 'Product list', path: '/category-1/sub-2/prod-2/'},
                        {title: 'Product list', path: '/category-1/sub-2/prod-3/'}
                    ]
                },
                {
                    title: 'Subcategory',
                    path: '/category-1/sub-3/',
                    children: [
                        {title: 'Product list', path: '/category-1/sub-3/prod-1/'},
                        {title: 'Product list', path: '/category-1/sub-3/prod-2/'},
                        {title: 'Product list', path: '/category-1/sub-3/prod-3/'},
                        {title: 'Product list', path: '/category-1/sub-3/prod-4/'},
                        {title: 'Product list', path: '/category-1/sub-3/prod-5/'}
                    ]
                },
                {
                    title: 'Subcategory',
                    path: '/category-1/sub-4/',
                    children: [
                        {title: 'Product list', path: '/category-1/sub-4/prod-1/'},
                        {title: 'Product list', path: '/category-1/sub-4/prod-2/'},
                        {title: 'Product list', path: '/category-1/sub-4/prod-3/'},
                    ]
                },
                {
                    title: 'Subcategory',
                    path: '/category-1/sub-5/',
                    children: [
                        {title: 'Product list', path: '/category-1/sub-5/prod-1/'}
                    ]
                },
            ]
        },
        {
            title: 'Category 2',
            path: '/category-2/',
            children: [
                {title: 'Category 2 Item 1', path: '/category-2/1/'},
                {title: 'Category 2 Item 2', path: '/category-2/2/'},
                {title: 'Category 2 Item 3', path: '/category-2/3/'},
            ]
        },
        {
            title: 'Category 3',
            path: '/category-3/',
            children: [
                {title: 'Category 3 Item 1', path: '/category-3/1/'},
                {title: 'Category 3 Item 2', path: '/category-3/2/'},
                {title: 'Category 3 Item 3', path: '/category-3/3/'},
            ]
        },
        {
            title: 'Category 4',
            path: '/category-4/',
            children: [
                {title: 'Category 4 Item 1', path: '/category-4/1/'},
                {title: 'Category 4 Item 2', path: '/category-4/2/'},
                {title: 'Category 4 Item 3', path: '/category-4/3/'},
            ]
        }
    ]
};

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <MegaMenu itemFactory={itemFactory} />
</Nav>
```


## A Note On SEO

In order to remain accessible to search engine crawlers, the Mega Menu family of components is designed in a way that it always renders the navigation in a fashion that can be read and understood by those crawlers. The Mega Menu may not be entirely visible to a typical (sighted) user, but are available to search engine crawlers. In this way, the Mega Menu also acts as a sort of sitemap.
