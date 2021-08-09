```js static
// JS import
import NavSlider from 'progressive-web-sdk/dist/components/nav-slider'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/nav-slider/base';
```

## Example Usage

You might notice that there are no fancy animations for our custom component. That's okay, we'll get to that in an example further down!

```jsx
/**
 * First we must import the third party'
 * `TransitionGroup` component
 */
const TransitionGroup = require('react-transition-group');

const CustomHeader = (props, context) => {
    /**
     * Notice that we use `expanded` and `expandedPath`
     * that we received from the `context`
     */
    const {expanded, expandedPath} = context

    /**
     * While in this example we do not make use of
     * `props`, it is available should ever you need it.
     */
    return (
        <TransitionGroup>
            <NavSlider key={expandedPath}>
                <h2>
                    {expanded && expanded.title || ''}
                </h2>
            </NavSlider>
        </TransitionGroup>
    )
}

/**
 * We must ensure that `CustomHeader` inherits
 * `childContextTypes` from `Nav`, otherwise it will not
 * receive its `context`.
 */
 CustomHeader.contextTypes = Nav.childContextTypes;


const initialState = {path: '/'};
const onPathChange = (path) => {
    setState({path: path})
};
const root = {
    title:"See My Custom Header?",
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

<Nav
    root={root}
    path={state.path}
    onPathChange={onPathChange}
>
    <CustomHeader />
    <NavMenu />
</Nav>
```

By itself, `NavSlider` does not look like much. Instead, we must use it in combination with components like [`TransitionGroup`](https://github.com/reactjs/react-transition-group). A common use case will be to use these two components together to create a custom [`NavHeader`](#!/NavHeader) component to be used in an instance of [Nav](#!/Nav).

The demonstration above shows how to create a custom component and apply it into a `Nav` component with a fully functional navigation tree. It's important to understand that such a custom component has a few requirements in order to work correctly: The custom component must take both `props` and `context` as arguments. These are automatically supplied by the `Nav` component, but must be enabled with the following:

```js static
const CustomHeader = (props, context) => {
    // define the custom header component here...
}
// Supply the context to our custom component...
CustomHeader.contextTypes = Nav.childContextTypes;
```


## Example With Custom Animations

_Coming Soon!_
