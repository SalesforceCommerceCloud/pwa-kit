<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this article from the site navigation because many of the source code examples in it are out of date, but we've left it here in case you still need to refer to it.
  </p>
</div>

## General

### Access props and state through destructuring

One of the most prominent features in ES6 is "destructuring" of objects
and arrays in parameters or assignments. This lets us directly declare
the contents of an object as variables or parameters in our
function. Doing so for the props or state makes the JSX of a component
terser and clearer.

#### Do

```jsx
const StatelessComponent = ({title, body, image}) => {
    return (
        <div>
            <h1>{title}</h1>
            <p>{body}</p>
            <Image {...image} />
        </div>
    )
}
```

```jsx
class StatefulComponent extends React.Component {
    render() {
        const {title, body, image} = this.props
        const {starred} = this.state

        return (
            <div>
                <h1>{title}{starred ? ' *' : ''}</h1>
                <p>{body}</p>
                <Image {...image} />
            </div>
        )
    }
}
```

#### Avoid

```jsx
const StatelessComponent = (props) => {
    return (
        <div>
            <h1>{props.title}</h1>
            <p>{props.body}</p>
            <Image {...props.image} />
        </div>
    )
}
```

```jsx
class StatefulComponent extends React.Component {
    render() {
        return (
            <div>
                <h1>{this.props.title}{this.state.starred ? ' *' : ''}</h1>
                <p>{this.props.body}</p>
                <Image {...this.props.image} />
            </div>
        )
    }
}
```

### Use built-in scripts to create components and pages

A PWA project contains scripts to create new components and pages. These scripts remove a lot of the boilerplate associated with creating new React components and pages. These generators are also kept up to date with current best practice in developing components and containers in Progressive
Web. This is much safer than, for example, copying existing components wholesale
to make new components.

To create a new component, run `npm run add:component`.

To create a new page, run `npm run add:page`.

### Pay attention to the linter; save time with fix mode

Both the SDK and the project generator are set up with ESLint and the Mobify
code style. While the lint rules are quite stringent, they are important to make
sure that, as much as possible, any developer familiar with the Progressive Web
system can read and understand any Progressive Web project. Please set up ESLint
integration with your source editor if at all possible. Plugins exist for most
common editors, including Sublime Text, Atom, WebStorm, Vim, and Emacs.

Many of the lint rules are 'fixable' in ESLint, meaning that the linter can
automatically violations of these rules. This functionality is exposed in the
NPM scripts; just run `npm run lint:fix`.

## Component usage

### Use Link component instead of anchor tag

Links within the React app need to be handled by the app itself to prevent page
reloading. The `Link` component in the SDK does this automatically, by handling
links to within the app internally and rendering an anchor tag for external
links. If the app renders a link directly as an anchor tag, it will reload the
app if the target URL is also within the Progressive app.

Since full page loads are slow and represent a break in the user experience, it
is crucial to avoid unnecessary reloads. For an experience that resembles a
native app, the app must maintain control over all transitions.

Because the Link component can take arbitrary props to be rendered on the anchor
tag, there is no circumstance where it would be problematic to use. Avoid using
the Link component from react-router, as it will not work with external URLs.

#### Do

```jsx
import Link from 'progressive-web-sdk/dist/components/link'

<Link href={productUrl}>{productName}</Link>
<Link href="https://www.customer.com/login" className={u--highlighted}>Login Now!</Link>
<Link href="#description">Jump to description</Link>
```

#### Avoid

```jsx
<a href={productUrl}>{productName}</a>
<a href="https://www.customer.com/login" className={u--highlighted}>Login Now!</a>
<a href="#description">Jump to description</a>

import {Link} from 'react-router'
<Link to="/product/description.html">My Product</Link>
```

### Do not use deprecated components in new builds

The SDK contains some deprecated components which are retained for continued
compatibility with the current builds. Any new build should avoid them for
improved performance and/or correctness.

Currently, the following components are deprecated:
* `NestedNavigation`. Use the `Nav` family of components instead.
* `FormFields`. Build the form directly with the `Field`, `FieldRow`, and
  `FieldSet` components.
* `Select`. Use a native `<select>` element inside of a `Field` component
  instead.

## Component development

### Ensure filenames match component names

The filename of a component should match the name of the component it exports.
Multiple related components may be defined in the same file, but only one
component should be exported as the default export. When multiple related
components are defined in the same directory, the main component can be defined
in a file called `index.jsx`. If more than one of these components needs to be
externally accessible, they can be re-exported as named exports in `index.jsx`

#### Do

```jsx
// in user-details.jsx

const UserName = ({name}) => ( /* ... */ )

const UserDetails = ({user}) => {
    // ...
}

export default UserDetails
```

```jsx
// in user-details/index.jsx

// UserName is not needed outside this directory
const UserName = ({name}) => ( /* ... */ )

const UserDetails = ({user}) => {
    // ...
}

export default UserDetails
```

```jsx
// in user-details/user-name.jsx

const UserName = ({name}) => ( /* ... */ )

export default UserName

// in user-details/index.jsx

import UserName from './user-name'

const UserDetails = ({user}) => {
    // ...
}

export default UserDetails

// Re-export UserName for external use
export {UserName}
```


#### Avoid

```jsx
// user.jsx

const UserDetails = ({user}) => {
    // ...
}

// AVOID: Exporting a component whose name doesn't match the file
export default UserDetails
```

```jsx
// user-details.jsx

// AVOID: Exporting multiple components from a file not named `index.jsx`
export const UserName = ({name}) => ( /* ... */ )

const UserDetails = ({user}) => {
    // ...
}

export default UserDetails
```


### Use correct CSS namespace

Components in the SDK have their internal CSS classes begin with `pw-`. In a
project, the classes should instead begin with `c-`. The component generator
will take care of this automatically in most cases.

### Be sure to bind methods only once

To pass class methods as callbacks, we must bind them to the current component
instance. Our standard practice is to do this in the constructor function, so
that the bound method is easily available anywhere in the class and is always
identically the same function. Binding functions multiple times will cause
performance and other problems, such as not unregistering an event handler
correctly.

#### Do

```jsx
class MyComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleScroll = this.handleScroll.bind(this)
        this.expandContents = this.expandContents.bind(this)
    }

    componentDidMount() {
        window.addEventListener('scroll', this.handleScroll)
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    handleScroll() { /* ... */ }
    expandContents() { /* ... */ }

    render() {
        const {contentsExpanded} = this.props

        return (
            <div>
                <button onClick={this.expandContents}>Expand</button>
                {contentsExpanded && <div>These are the contents</div>}
            </div>
        )
    }
}
```

#### Avoid

```jsx
class MyComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleScroll = this.handleScroll.bind(this)
    }

    componentDidMount() {
        // AVOID: this.handleScroll is already bound
        window.addEventListener('scroll', this.handleScroll.bind(this))
    }

    componentWillUnmount() {
        // AVOID: this will pass a different function than for addEventListener
        window.removeEventListener('scroll', this.handleScroll.bind(this))
    }

    handleScroll() { /* ... */ }
    expandContents() { /* ... */ }

    render() {
        const {contentsExpanded} = this.props

        return (
            <div>
                {/* AVOID: This will pass a different function each time,
                    which requires updating the DOM each time */}
                <button onClick={this.expandContents.bind(this)}>Expand</button>
                {contentsExpanded && <div>These are the contents</div>}
            </div>
        )
    }
}
```

### Prefer stateless components

If no lifecycle methods or persistent state is necessary in a component, it should be written as a stateless functional component. If there is nothing but JSX in the component, it should be written as a single-expression arrow function.

#### Do

```jsx
const MyTrivialComponent = ({first, second}) => (
    <div className={componentClass}>
        <div className={u-left}>{first}</div>
        <div className={u-right}>{second}</div>
    </div>
)

const MyStatelessComponent = ({position, height}) => {
    const percentage = Math.round(position/height)

    return (
        <div className={componentClass}>
            Viewed {percentage}% of the page
        </div>
    )
}

class MyStatefulComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            counter: 0
        }
    }

    render() {
        const {increment} = this.props
        const {counter} = this.state

        return (
            <Button onClick={() => this.setState({counter: counter + increment})}>
                {counter}
            </Button>
        )
    }
}
```

#### Avoid

```jsx
const MyTrivialComponent = ({first, second}) => {
    return (
        <div className={componentClass}>
            <div className={u-left}>{first}</div>
            <div className={u-right}>{second}</div>
        </div>
    )
}

class MyStatelessComponent extends React.Component {
    render() {
        const {position, height} = this.props
        const percentage = Math.round(position/height)

        return (
            <div className={componentClass}>
                Viewed {percentage}% of the page
            </div>
        )
    }
}
```

### Never duplicate names between state and props

If both props and state contain values with the same name, this introduces
ambiguities in the code of the component, especially if destructuring is used in
methods that use many parts of the state and props (such as `render()`). If
state and props values are related, it should always be possible to find
different names. If one name is simpler, prefer using it for the prop as it is
an externally visible part of the API.

#### Do (but see next point!)

```jsx
class Pager extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentPage: props.page
        }
        this.advancePage = this.advancePage.bind(this)
    }

    componentWillReceiveProps(newProps) {
        if (this.props.page !== newProps.page) {
            this.setState({currentPage: newProps.page})
        }
    }

    advancePage() => {
        this.setState({currentPage: this.state.currentPage + 1})
    }

    render() {
        const {children} = this.props
        const {currentPage} = this.state

        return (
            <div className="c-pager">
                {children[currentPage]}
                <Button onClick={this.advancePage}>Advance</Button>
            </div>
        )
    }
}
```

#### Never

```jsx
class Pager extends React.Component {
    constructor(props) {
        super(props)

        // The ambiguity is introduced here
        this.state = {
           page: props.page
        }
        this.advancePage = this.advancePage.bind(this)
    }

    componentWillReceiveProps({page}) {
        this.setState({page})
    }

    advancePage() => {
        if (this.props.page !== newProps.page) {
            this.setState({page: newProps.page})
        }
    }

    render() {
        const {children} = this.props
        const {page} = this.state

        return (
            <div className="c-pager">
                {/* Can't tell from this line if it is props.page or state.page */}
                {children[page]}
                <Button onClick={this.advancePage}>Advance</Button>
            </div>
        )
    }
}
```

### Avoid initializing state from props

When the state of a component is initialized from its props, care must be taken
to ensure that changes to those props are treated correctly. It is surprising to
the user of a component when a change to props is not reflected in the component
as rendered, so a `componentWillReceiveProps` method is needed to update the
state from any new props. This adds complexity to the component and is easy to
get wrong, so the entire pattern should be avoided whenever possible.

The main alternative designs are:
 - Initialize state from constants, and manage the value entirely inside the component.
 - Change from a state variable to a prop, and provide a callback prop to signal the parent component to change the prop accordingly when the component is interacted with.
 - Combine state and props in rendering, if that is practical and not confusing.

#### Do

```jsx
// As written this way, this component provides no external means for
// changing the page.
class Pager extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentPage: 0
        }
        this.advancePage = this.advancePage.bind(this)
    }

    advancePage() => {
        this.setState({currentPage: this.state.currentPage + 1})
    }

    render() {
        const {children} = this.props
        const {currentPage} = this.state

        return (
            <div className="c-pager">
                {children[currentPage]}
                <Button onClick={this.advancePage}>Advance</Button>
            </div>
        )
    }
}
```
```jsx
// If the component is written in this way, it will not advance unless the
// onAdvance callback causes a change to the currentPage prop.
const Pager = ({children, currentPage, onAdvance}) => (
    <div className="c-pager">
       {children[currentPage]}
       <Button onClick={onAdvance}>Advance</Button>
    </div>
)
```

#### Avoid

```javascript
// This component is responsive to both state and prop changes, where
// prop changes from the outside override the changes to the state.

// Avoid this unless passing managing the state entirely through the parent
// component heavily complicates the design.
class Pager extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentPage: props.page
        }
        this.advancePage = this.advancePage.bind(this)
    }

    componentWillReceiveProps(newProps) {
        if (this.props.page !== newProps.page) {
            this.setState({currentPage: newProps.page})
        }
    }

    advancePage() => {
        this.setState({currentPage: this.state.currentPage + 1})
    }

    render() {
        const {children} = this.props
        const {currentPage} = this.state

        return (
            <div className="c-pager">
                {children[currentPage]}
                <Button onClick={this.advancePage}>Advance</Button>
            </div>
        )
    }
}
```

#### Never

```javascript
class Pager extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentPage: props.page
        }
        this.advancePage = this.advancePage.bind(this)
    }

    // Without setting the state in a componentWillReceiveProps method,
    // changing the `page` prop does nothing, which is a confusing API.

    advancePage() => {
        this.setState({currentPage: this.state.currentPage + 1})
    }

    render() {
        const {children} = this.props
        const {currentPage} = this.state

        return (
            <div className="c-pager">
                {children[currentPage]}
                <Button onClick={this.advancePage}>Advance</Button>
            </div>
        )
    }
}
```

### Be prepared for a single child

The React `children` prop is unusual, in that it can either be an array (if
multiple children are passed), or a single node. Thus, blindly indexing it could
lead to confusing results (if the single child is a string) or Javascript
errors. The `React.Children` object has several useful functions for dealing
with this difference, or, if array semantics are strictly necessary, single
children can be wrapped.

#### Do

```jsx
const ButtonList = ({children, clickHandler}) => {
    return (
        <ul className={componentClass}>
            {React.Children.map(children, (child, idx) =>
                React.cloneElement(child, {onClick: () => clickHandler(idx)}))}
        </ul>
    )
}

const CountedList = ({children}) => {
    return (
        <div className={componentClass}>
            <div className={countClass}>
                List with {React.Children.count(children)} entries:
            </div>
            <ul className={innerClass}>
                {children}
            </ul>
        </div>
    )
}
```

#### Do Sparingly

```jsx
const ButtonList = ({children, clickHandler}) => {
    const childArray = React.Children.count(children) > 1 ? children : [children]

    return (
        <ul className={componentClass}>
            {childArray.map((child, idx) =>
                React.cloneElement(child, {onClick: () => clickHandler(idx)}))}
        </ul>
    )
}
```

#### Avoid

```jsx
const ButtonList = ({children, clickHandler}) => {
    return (
        <ul className={componentClass}>
            {/* children.map will fail if a single child is passed */}
            {children.map((child, idx) =>
                React.cloneElement(child, {onClick: () => clickHandler(idx)}))}
        </ul>
    )
}

const CountedList = ({children}) => {
    return (
        <div className={componentClass}>
            <div className={countClass}>
                {/* children.length will fail or give misleading results if a single child is passed */}
                List with {children.length} entries:
            </div>
            <ul className={innerClass}>
                {children}
            </ul>
        </div>
    )
}
```

### Functions returning JSX should be components

Long `render` methods are difficult to work with and splitting them up
into modular functions is a good idea. However, these functions should
themselves be React components rather than plain functions, to better
reflect their role in the UI.

To make a function a React component it must:
 - Have a name that begins with a capital letter
 - Take a single props argument that is destructured to access the
   props
 - Have PropType validation
 - Be called from a JSX tag rather than inside a JS substitution

#### Do

```jsx
const COMPONENT_CLASS = 'c-display'
const LIST_CLASS = `${COMPONENT_CLASS}__list`
const BUTTON_CLASS = `${COMPONENT_CLASS}__button`

const DisplayList = ({items}) => (
    <ul className={LIST_CLASS}>
        {items.map(({text, href}) => <a href={href}>{text}</a>)}
    </ul>
)

DisplayList.propTypes = {
    items: PropTypes.array
}

const DisplayButton = ({onClick}) => (
    <button className={BUTTON_CLASS} onClick={onClick}>
        Confirm and Submit
    </button>
)

DisplayButton.propTypes = {
    onClick: PropTypes.func
}

const Display = ({items, onClick}) => (
    <div className={COMPONENT_CLASS}>
        <DisplayList items={items} />
        <DisplayButton onClick={onClick} />
    </div>
)
```

#### Avoid

```jsx
const COMPONENT_CLASS = 'c-display'
const LIST_CLASS = `${COMPONENT_CLASS}__list`
const BUTTON_CLASS = `${COMPONENT_CLASS}__button`

const renderListItems = (items) =>
    items.map(({text, href}) => <a href={href}>{text}</a>)}

// AVOID: The onClick argument is passed bare, rather than as a prop
const renderButton = (onClick) => (
    <button className={BUTTON_CLASS} onClick={onClick}>
        Confirm and Submit
    </button>
)

const Display = ({items, onClick}) => (
    <div className={COMPONENT_CLASS}>
        <ul className={LIST_CLASS}>
            {/* AVOID: JSX elements are produced and substituted
              rather than being part of a JSX tag */}
            {renderListItems(items)}
        </ul>
        {renderButton(onClick)}
    </div>
)
```

### Split large React components into partials

It is easy for the JSX markup in a large React component to become
unwieldy and difficult to navigate and test. To avoid this, break
components into smaller components as the markup grows. Place any
non-trivial sub-components in their own files in a `partials/`
subdirectory, while very small component functions can live in the
same source file as where they are used.

A good guideline for deciding how to divide these components is that
if a given prop or set of props is only relevant for a single section
of markup, that section should move to its own component.

This is especially useful for template components. At the top level of
a template, we should aim to have a simple list of sub-components that
clearly express the major pieces of the template. These components
should, in this case, be connected separately to the Redux store (see below).

#### Do

```jsx
// partials/product-basic-details.jsx
const ProductBasicDetails = ({name, category, price}) => (
   <div className={basicDetailsClass}>
       <h1>{name}</h1>
       <Image src=`categories/${category}.png` alt={name} />
       <h3>{price}</h3>
   </div>
)

// partials/product-image-carousel.jsx
const ProductImageCarousel = ({images}) => (
   <Carousel className={productCarouselClass} {/* ... */}>
       {images.map((item, idx) => <CarouselItem key={idx} {...item} />)}
   </Carousel>
)

// partials/product-reviews.jsx
const ProductReviewItem = ({title, body}) => (
   <AccordionItem title={title}>
       {body}
   </AccordionItem>
)

const ProductReviews = ({reviews}) => (
   <Accordion className={reviewsSectionClass}>
       {reviews.map((review, idx) => <ProductReviewItem key={idx} {...review} />)}
   </Accordion>
)

// in index.jsx
render() {
    const {basicInfo, productImages, reviews} = this.props

    return (
        <div className={containerClass}>
            <ProductBasicDetails {...basicInfo} />
            <ProductImageCarousel images={productImages} />
            <ProductReviews reviews={reviews} />
        </div>
    )
}
```

#### Avoid

```jsx
render() {
    const {basicInfo, productImages, reviews} = this.props.toJS()

    return (
        <div className={containerClass}>
            <div className={basicDetailsClass}>
                <h1>{basicInfo.name}</h1>
                <Image src=`categories/${basicInfo.category}.png` alt={basicInfo.name} />
                <h3>{basicInfo.price}</h3>
            </div>

            <Carousel className={productCarouselClass} {/* ... */}>
                {productImages.map((item, idx) => <CarouselItem key={idx} {...item} />)}
            </Carousel>

            <Accordion className={reviewsSectionClass}>
                {reviews.map((review, idx) => (
                    <AccordionItem title={review.title}>
                        {review.body}
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}
```

### Do not declare components inside a render function

If a component (ComponentB) is declared inside the render function of another component (ComponentA), ComponentB will be remounted whenever ComponentA rerenders. This impacts performance, as it prevents React from determining which DOM nodes have actually changed during a render. Instead of rerendering only the elements that have changed, React is always forced to rerender Component B.

#### Do

```js
const ComponentB = ({title}) => {
    return (
        <span>{title}</span>
    )
}


const ComponentA = ({title}) => {
    return (
        <div>
            <ComponentB title={title} />
        </div>
    )
}
```

#### Avoid

```js
const ComponentA = ({title}) => {
    const ComponentB = () => {
        return (
            <span>{title}</span>
        )
    }

    return (
        <div>
            <ComponentB />
        </div>
    )
}
```

## Container development

### Connect to the store where data is needed

An advantage of the design of the Redux store is that it is equally available from all parts of the React component tree. As such, it can replace a boilerplate-heavy passing of data one or more levels through the tree as props with a single connection, right where the data is needed. This also makes rendering more efficient, as only the place where the state has actually changed need to rerender.

#### Do

```jsx
// partials/product-basic-details.jsx
const ProductBasicDetails = ({name, category, price}) => (
   <div className={basicDetailsClass}>
       <h1>{name}</h1>
       <Image src=`categories/${category}.png` alt={name} />
       <h3>{price}</h3>
   </div>
)

const mapStateToProps = createPropsSelector({
    name: getName,
    category: getCategory,
    price: getPrice
})

export connect(mapStateToProps)(ProductBasicDetails)

// partials/product-image-carousel.jsx
const ProductImageCarousel = ({images}) => (
   <Carousel className={productCarouselClass} {/* ... */}>
       {images.map((item, idx) => <CarouselItem key={idx} {...item} />)}
   </Carousel>
)

const mapStateToProps = createPropsSelector({
    images: getProductImages
})

export default connect(mapStateToProps)(ProductImageCarousel)

// partials/product-reviews.jsx
const ProductReviewItem = ({title, body}) => (
   <AccordionItem title={title}>
       {body}
   </AccordionItem>
)

const ProductReviews = ({reviews}) => (
   <Accordion className={reviewsSectionClass}>
       {reviews.map((review, idx) => <ProductReviewItem key={idx} {...review} />)}
   </Accordion>
)

const mapStateToProps = createPropsSelector({
    reviews: getProductReviews
})

export default connect(mapStateToProps)(ProductReviews)

// in index.jsx
render() (
        <div className={containerClass}>
            <ProductBasicDetails />
            <ProductImageCarousel />
            <ProductReviews />
        </div>
    )
}
```

#### Avoid

```jsx
// partials/product-basic-details.jsx
const ProductBasicDetails = ({name, category, price}) => (
   <div className={basicDetailsClass}>
       <h1>{name}</h1>
       <Image src=`categories/${category}.png` alt={name} />
       <h3>{price}</h3>
   </div>
)

// partials/product-image-carousel.jsx
const ProductImageCarousel = ({images}) => (
   <Carousel className={productCarouselClass} {/* ... */}>
       {images.map((item, idx) => <CarouselItem key={idx} {...item} />)}
   </Carousel>
)

// partials/product-reviews.jsx
const ProductReviewItem = ({title, body}) => (
   <AccordionItem title={title}>
       {body}
   </AccordionItem>
)

const ProductReviews = ({reviews}) => (
   <Accordion className={reviewsSectionClass}>
       {reviews.map((review, idx) => <ProductReviewItem key={idx} {...review} />)}
   </Accordion>
)

// in index.jsx
const Product = ({basicInfo, productImages, reviews}) => {
    return (
        <div className={containerClass}>
            <ProductBasicDetails {...basicInfo} />
            <ProductImageCarousel images={productImages} />
            <ProductReviews reviews={reviews} />
        </div>
    )
}

const mapStateToProps = createPropsSelector({
    basicInfo: getBasicInfo,
    productImages: getProductImages,
    reviews: getProductReviews
})

export default connect(mapStateToProps)(Product)

```

### Use a mapDispatchToProps object if possible

The react-redux `connect` function can either take a function or an object for
the `mapDispatchToProps` parameter. If an object is passed, its keys are treated
as action creators and wrapped in the `dispatch` function to be passed as props.
This is a much more compact and clearer method to express the simplest case
where the parameters from the component are passed directly to the action
creator.

If an object must be converted to a function, the `bindActionCreators` function
in Redux can be used to preserve the simpler semantics for simpler actions.

#### Do

```javascript
const mapDispatchToProps = {
    fetchReviewBody,
    setStarCount,
    openHelpModal: () => openModal('review-help'),
    submitReview: (text, title) => submitReview({text, title})
}

const mapDispatchToProps = (dispatch) => {
    return {
        ...bindActionCreators({
            fetchReviewBody,
            setStarCount,
            openHelpModal: () => openModal('review-help'),
            submitReview: (text, title) => submitReview({text, title})
        }, dispatch),
        // ...
    }
}
```

#### Avoid

```javascript
const mapDispatchToProps = (dispatch) => {
    return {
        fetchReviewBody: () => dispatch(fetchReviewBody()),
        setStarCount: (count) => dispatch(setStarCount(count)),
        openHelpModal: () => dispatch(openModal('review-help')),
        submitReview: (text, title) => dispatch(submitReview({text, title}))
        // optionally more!
    }
}
```

### Do not pass events to action creators

Action creator functions should not be aware of DOM/React events; this deeply
limits their reusability. If data from the event is needed for the Redux action,
write a function or method in the component to extract it and pass it to the
action creator that way.

Functional props created using the object form of `mapDispatchToProps` will pass
any arguments they receive through to the action creator. If the prop is used as
an event callback on an element, it will thus receive the event object. This
causes a noisy React error which we would like to avoid. If the action creator
is wrapped in a zero-parameter function, this is suppressed and the error does
not leak to the action creator. This wrapping should be done in
`mapDispatchToProps` and not in the component, so that the function is not
recreated on every render.

The scaffold provides a utility function `stripEvent` to make stripping the
event self-documenting.

#### Do

```jsx
render() {
    return (
        <Button onClick={this.props.expandContent}>Expand</Button>
    )
}

// ...

const mapDispatchToProps = {
    expandContent: stripEvent(actions.expandContent)
}
```

```jsx
const mapDispatchToProps = {
    // Prevent event from leaking into action creator
    expandContent: () => actions.expandContent()
}
```

#### Avoid

```jsx

render() {
    return (
        <Button onClick={() => this.props.expandContent()}>Expand</Button>
    )
}

const mapDispatchToProps = {
    expandContent: actions.expandContent
}
```

```jsx
render() {
    return (
        <Button onClick={this.props.expandContent}>Expand</Button>
    )
}

const mapDispatchToProps = {
    expandContent: actions.expandContent
}
```

### Avoid using props in mapDispatchToProps

The `mapDispatchToProps` function for exposing Redux actions to React components
can take a second parameter for the incoming props of the component. This is not
recommended. If the `mapDispatchToProps` function does not depend on the props,
Redux is able to cache the functions it returns and passes the very same
functions each time. This can help reduce `shouldComponentUpdate` false
positives, since the functions as passed to child components will be equal on
every render.

#### Do

```javascript
const mapDispatchToProps = (dispatch) => {
    return {
        openInformationModal: () => dispatch(openModal('information'))
    }
}
```

#### Avoid

```javascript
const mapDispatchToProps = (dispatch, props) => {
    return {
        fetchMoreReviews: () => dispatch(fetchReviews(props.moreReviewsUrl))
    }
}
```

#### Never

```javascript
const mapDispatchToProps = (dispatch, props) => {
    return {
        openInformationModal: () => dispatch(openModal('information'))
    }
}
```

### Use Integration Manager commands for backend requests

The [Integration Manager](../../ecommerce-integrations) is a library of
Redux thunk actions called 'commands' that encapsulates the
communication between your app and the backend. All network requests
should be done through the Integration Manager, either through the
standard commands or through custom commands added by the code in your
app.

Integration Manager commands will return a Promise when dispatched
that resolves on success and rejects on failure. We can use this in
the calling code, for example, to set up visual feedback in the UI
that an operation is in progress. The resolution value is usually
meaningless and any meaningful result of the request is dispatched
directly to the Redux store, while the rejection value can provide
information on the specific cause and type of failure.

#### Do

```javascript
import IntegrationManager from 'mobify-integration-manager/dist/'

const addToCartHandler = (productId, quantity, variant) => (dispatch) => {
    dispatch(setAddToCartInProgress(true))

    dispatch(IntegrationManager.cart.addToCart(productId, quantity, variant))
        .catch((err) => dispatch(displayErrorNotification(err)))
        // this will run regardless of whether there is an error
        // because the `catch` handler returns
        .then(() => dispatch(setAddToCartInProgress(false)))
}
```

#### Avoid

```javascript
const addToCartHandler = (productId, quantity) => (dispatch) => {
    dispatch(setAddToCartInProgress(true))

    // Don't make requests from outside IM commands
    makeRequest(
        `/cart/addItem?product=${productId}&quantity=${quantity}`,
        {method: 'POST'}
    )
        .then((response) => response.json())
        .then((responseData) => dispatch(receiveAddToCartResponse(responseData)))
        .catch((err) => dispatch(displayErrorNotification(err)))
        // this will run regardless of whether there is an error
        // because the `catch` handler returns
        .then(() => dispatch(setAddToCartInProgress(false)))
}

const submitFeedbackForm = (formData) => (dispatch) => {
    dispatch(submitFeedbackCommand(formData))
        // Command implementations should dispatch fetched data to the
        // store directly
        .then((responseJson) => {
            if (!responseJson.success) {
                dispatch(setFeedbackError())
            } else {
                dispatch(setFeedbackSuccessMessage(responseJson.message))
            }
        })
}
```

## Testing

### Avoid .contains testing in Enzyme

Enzyme wrappers have a `.contains` method which checks if the rendered component
contains the provided JSX. This matching must be exact, making the test fragile
and the resulting error message uninformative. Instead, test the relevant
features individually.

#### Do

```jsx
test('Component renders the title prop in an appropriate div', () => {
    const wrapper = shallow(<Component title="Test Title" />)

    // Still works if you add another class or prop to the title div
    const titleElement = wrapper.find('.c-component__title')
    expect(titleElement.length).toBe(1)
    expect(titleElement.type()).toBe('div')
    expect(titleElement.text()).toBe('Test Title')
})
```

#### Avoid

```jsx
test('Component renders the title prop in an appropriate div', () => {
    const wrapper = shallow(<Component title="Test Title" />)

    // breaks if any aspect of the JSX changes, with un-useful 'false is not true' error message
    expect(wrapper.contains(<div className="c-component__title">Test Title</div>)).toBe(true)
})
```

### Unwrap connected components in tests

Components that are connected to the Redux store require a store to be
rendered, making them more difficult to test. Instead, unwrap the
components in the test file, which permits testing through direct
passing of props.

#### Do

```jsx
// In index.jsx

class Component extends React.Component {
    // ...
}

const mapStateToProps = // ...
const mapDispatchTopProps = // ...

export default connect(mapStateToProps,
mapDispatchTopProps)(Component)

// in test.js

import ConnectedComponent from './index'

const Component = ConnectedComponent.WrappedComponent

test('renders correctly', () => {
    const wrapper = mount(<Component />)

    expect(wrapper.length).toBe(1)
})
```

#### Avoid

```jsx
// In index.jsx

class Component extends React.Component {
    // ...
}

const mapStateToProps = // ...
const mapDispatchTopProps = // ...

export const RawComponent = Component

export default connect(mapStateToProps,
mapDispatchTopProps)(Component)

// in test.js

import {RawComponent} from './index'

test('renders correctly', () => {
    const wrapper = mount(<RawComponent />)

    expect(wrapper.length).toBe(1)
})
```

## Performance

## Regularly check Lighthouse scores
[Lighthouse](https://developers.google.com/web/tools/lighthouse/) performs an audit of your Progressive Web App (PWA) and provides helpful recommendations around PWA standards, accessibility, and performance. Regularly checking your Lighthouse performance score can help you determine improvements you can make to your PWA.

<div class="c-callout">
 <p>
   <strong>Note:</strong> Because of the caching behavior of tag-loaded PWAs, it's best to use the second Lighthouse test result as the most representative indicator of the PWA's performance. The second test will have a cached and gzipped response, which is what makes it a more representative indicator.
 </p>
</div>

To run Lighthouse against a local build using preview, start your development server with `npm run start`. Run `npm run test:pwa-preview` in another shell. To test against the production version of your PWA, run `npm run test:pwa-prod`.

## Regularly check bundle size
One of the biggest factors for performance is the size of the bundle. The bundle is the set of files that powers the PWA. The size of the bundle impacts how quickly we are able to download and render the PWA.

To check the size of your bundle, run `npm run analyze-build`. This will display a page where you can see the size of your files, as well as what dependencies are included in those files. Projects also contain an automated test which will fail if the size of key files in your bundle goes above a certain threshold. For more information, see the [Automated Testing Overview](../automated-testing/#bundle-size).

If those files are larger than expected, take a look at the dependencies that are being included. Determine if any dependencies can be removed. If you see a dependency you don't recognize, run `npm ls <dependency-name>` to determine what is including it in your project.

Before adding a dependency to your project, consider the impact on performance. Avoid adding a dependency that is larger than 25KB (after gzip). Large dependencies can significantly increase the overall bundle size and in turn affect performance. Here are questions you should ask yourself before adding a dependency:

- **Are you trying to add a React component library?**

    You'll find many common components in the [Progressive Web SDK Component library](../../components/).

- **Are you trying to add a utility library?**

    [Lodash](https://lodash.com/) is a JavaScript utility library that is great when working with arrays, numbers, objects, strings, etc.

- **Is the library absolutely necessary?**

    It's not always good practice to include libraries that are used infrequently in your application. Sometimes, implementing a few simple functions can do the job quite well.

After running `npm run analyze-build`, you will see a page that is similar to the screenshot below.

![Bundle size analyzer output page.](bundle-size.png)

The first thing you'll notice is that the bundle splits into many files. Their are three major file groups: vendor.js, main.js and container files.

**Vendor.js** is the file that contain all the dependencies that we use to power the PWA.

Major out-of-the-box dependencies:
- progressive-web-sdk
- mobify-integration-manager
- react
- react-dom
- react-redux
- react-router
- react-intl (If your project does not need internationalization, read [How to remove react-intl](../internationalization/#how-to-remove-react-intl))
- redux-form
- immutablejs
- lodash
- ...and more

When analyzing vendor.js, look for duplicate or unnecessary packages. Be careful not to import two versions of a package. Most of the time we want to use the ES6 version of the packages. Lodash is an exception because many of the core packages depend on the ES5 version of lodash.

**Main.js** is the core JavaScript file that is required to start the PWA. To decrease the initial loading time, try to make it as small as possible by splitting containers if the containers can be loaded later.

The rest are container files that are split by Webpack, which are only being loaded on demand (in order to optimize performance). When creating a new container that is not required on the first page load, you want to make sure the container is defined in `app/containers/templates` as a PWALoadable component.

## Lazy load images and 3rd party content
Lazy loading refers to the practice of waiting to load something until it is needed. For images and 3rd party content, this means waiting until the content is about to be shown to the user before loading it. This can reduce the number of files that the browser needs to download when first rendering a page. It can also reduce the size of the page overall, as some files may never be downloaded if the user never needs them.

Both the [LazyLoader](../../components/#!/LazyLoader) and [ScrollTrigger](../../components/#!/ScrollTrigger) components can be used to lazy load content on your PWA.

## Use optimized images
When possible, show images that are appropriately sized for the device the user will be viewing them on. Some ecommerce back ends, such as Salesforce Commerce Cloud, will automatically resize images if you specify your desired dimensions as query parameters. Determine if your back end or image provider supports this functionality.

## Use native fonts
When possible, prefer native fonts over web fonts. By using native fonts, you avoid having to download web font files and you reduce the number of resources that must be downloaded in order to first render your app.

By default, projects use [webfontloader](https://github.com/typekit/webfontloader). If you are using only native fonts on your project, remove this code.

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>
