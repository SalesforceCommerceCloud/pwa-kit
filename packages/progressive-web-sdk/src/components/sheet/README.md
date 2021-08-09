```js static
// JS import
import Sheet from 'progressive-web-sdk/dist/components/sheet'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/sheet/base';
```


## Example Usage

The simplest way of adding a modal is to follow these steps:

1. Track whether the `Sheet` is open in the app state
2. Create an action that sets the modal's open state to `true` or `false`
3. Add the sheet to the UI along with an interactive element, such as a button, that can open the it

Below is a demonstration of this simple example:

```jsx
// First we track in the state whether the sheet is
// open or closed.
initialState = { modalIsOpen: false };

// Second, we create an "action" that sets the sheet's
// state to open or close. In a React app this would
// probably be a Redux action instead
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

// Lastly, we create the UI with the sheet itself, as
// well as a button that can be used to open the sheet.
// Notice that we provide the sheet a `onDismiss`
// callback. If we didn't, there would be no way to
// close the modal!
<div>
    <Button onClick={() => toggleModal(true)}>
        Open Sheet
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
    >
        <p>Prevailed sincerity behaviour to so do principle mr. As departure at no propriety zealously my. On dear rent if girl view. First on smart there he sense. Earnestly enjoyment her you resources. Brother chamber ten old against. Mr be cottage so related minuter is. Delicate say and blessing ladyship exertion few margaret. Delight herself welcome against smiling its for.</p>
    </Sheet>
</div>
```


## Example Of Lifecycle Callbacks

| Order | <span style="white-space: nowrap;">Open Callbacks</span> | Explanation |
| --- | --- | --- |
| 1 | `onBeforeOpen`  | Triggered by `Sheet` before it actually opens. |
| 2 | `onOpen`        | Triggered by `Sheet` after it finishes opening. |


| Order | Close Callbacks | Explanation |
| --- | --- | --- |
| 1 | `onDismiss`     | Triggered by the user clicking on the "shade" backdrop. **Warning**: This callback will _not_ close the modal for you! |
| 2 | `onBeforeClose` | Triggered by `Sheet` before it actually closes. |
| 3 | `onClose`       | Triggered by the `Sheet` after it finishes closing. |

```jsx
initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

// Below are functions that will all call `alert()`
// which should help visualize where the function is
// run, relative to the other functions.
const beforeOpen = () => {
    alert('`onBeforeOpen` called')
};
const open = () => {
    alert('`onOpen` called')
    toggleModal(true)
};
const beforeClose = () => {
    alert('`onBeforeClose` called')
};
const close = () => {
    alert('`onClose` called')
};
const dismiss = () => {
    alert('`onDismiss` called, will run `toggleModal(false), or nothing else will happen!`')
    toggleModal(false)
};

<div>
    <Button onClick={() => toggleModal(true)}>
        Click To See Each Lifecycle Step
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onBeforeOpen={beforeOpen}
        onOpen={open}
        onBeforeClose={beforeClose}
        onClose={close}
        onDismiss={dismiss}
    >
        <Button
            onClick={() => toggleModal(false)}
            className="pw--primary"
        >
            Close Sheet (<code>toggleModal(false)</code>)
        </Button>
    </Sheet>
</div>
```


## Example With `coverage` Prop

The `coverage` prop is how much of the screen the modal will occupy. Take careful note that the `coverage` prop takes in a percentage as a string rather than a decimal. So use `50%` and not `0.5`.

```jsx
// Let's set this example's coverage to 15% and see
// what that looks like!
initialState = {
    coverage: '15%',
    modalIsOpen: false
};
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <select
        onChange={(e) => setState({coverage: e.target.value})}
        style={{'display': 'block'}}
    >
        <option value='15%'>15% Coverage</option>
        <option value='40%'>40% Coverage</option>
        <option value='75%'>75% Coverage</option>
        <option value='100%'>100% Coverage</option>
    </select>

    <Button onClick={() => toggleModal(true)}>
        Open Sheet
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        coverage={state.coverage}
    >
        <Button
            className="u-width-full"
            onClick={() => toggleModal(false)}
        >
            Close Sheet
        </Button>

        <p>Prevailed sincerity behaviour to so do principle mr. As departure at no propriety zealously my. On dear rent if girl view. First on smart there he sense. Earnestly enjoyment her you resources. Brother chamber ten old against. Mr be cottage so related minuter is. Delicate say and blessing ladyship exertion few margaret. Delight herself welcome against smiling its for.</p>
    </Sheet>
</div>
```


## Example With `duration` Prop

The `duration` prop controls the length of time it takes for the sheet to animate open and close.

```jsx
// Let's set this example's duration to 100ms and see
// what that looks like!
initialState = {
    duration: 100,
    modalIsOpen: false
};
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <select
        onChange={(e) => setState({duration: e.target.value})}
        style={{'display': 'block'}}
    >
        <option value='100'>100ms</option>
        <option value='500'>500ms</option>
        <option value='1000'>1000ms</option>
        <option value='2000'>2000ms</option>
    </select>

    <Button onClick={() => toggleModal(true)}>
        Open Sheet With `duration`
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        duration={state.duration}
    >
        <Button
            className="u-width-full"
            onClick={() => toggleModal(false)}
        >
            Close Sheet
        </Button>

        <p>Prevailed sincerity behaviour to so do principle mr. As departure at no propriety zealously my. On dear rent if girl view. First on smart there he sense. Earnestly enjoyment her you resources. Brother chamber ten old against. Mr be cottage so related minuter is. Delicate say and blessing ladyship exertion few margaret. Delight herself welcome against smiling its for.</p>
    </Sheet>
</div>
```


## Example With `effect` Prop

The `effect` prop defines which animation effect the sheet will use on open and close. The different options behave as follows:

| Value | Description |
| ----- | ----------- |
| `slide-top`    | Slides into view from the top of the screen. |
| `slide-right`  | Slides into view from the right side of the screen |
| `slide-bottom` | Slides into view from the bottom of the screen  |
| `slide-left`   | Slides into view from the left side of the screen |
| `modal-center` | From the center of the screen, grows to fill the screen |

```jsx
initialState = {
    effect: 'slide-top',
    open: false
};

<div>
    <select
        onChange={(e) => setState({effect: e.target.value})}
        style={{'display': 'block'}}
    >
        <option value='slide-top'>Slide Top</option>
        <option value='slide-right'>Slide Right</option>
        <option value='slide-bottom'>Slide Bottom</option>
        <option value='slide-left'>Slide Left</option>
        <option value='modal-center'>Modal Center</option>
    </select>

    <Button
        onClick={() => setState({open: true})}
    >
        Open Sheet
    </Button>

    <Sheet
        open={state.open}
        effect={state.effect}
        onDismiss={() => { setState({open: false}) }}
    >
        <p>Prevailed sincerity behaviour to so do principle mr. As departure at no propriety zealously my. On dear rent if girl view. First on smart there he sense. Earnestly enjoyment her you resources. Brother chamber ten old against. Mr be cottage so related minuter is. Delicate say and blessing ladyship exertion few margaret. Delight herself welcome against smiling its for. Suspected discovery by he affection household of principle perfectly he.</p>
    </Sheet>
</div>
```


## Example With `footerContent` Prop

It is possible to pass the `Sheet` component a custom footer via the `footerContent` prop. A common pattern for this might be a persistent navigation at the bottom of a navigation sidebar, fine print, or just about anything else you can imagine.

```jsx
// Here we define a custom footer for our modal
const customFooter = (
    <div style={{ background: '#ff852c' }}>
        I am a custom footer!
    </div>
);


initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <Button onClick={() => toggleModal(true)}>
        Open Sheet to see <strong>Custom Footer</strong>
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        footerContent={customFooter}
    >
        <p>Notice below at the very bottom here there is a footer!</p>
    </Sheet>
</div>
```


## Example With `headerContent` Prop

Just like a custom footer, it is possible to pass the `Sheet` component a custom header via the `headerContent` prop. A common pattern for this is to provide the modal with a highly customized header, such as the ones described under the `Sheet`'s design docs.

```jsx
// Here we define a custom header for our modal
const customHeader = (
    <div
        className="u-flexbox"
        style={{ background: '#ff852c' }}
    >
        <div className="u-flex">
            I am a custom Header!
        </div>
        <div>
            <Button onClick={() => toggleModal(false)}>
                Close
            </Button>
        </div>
    </div>
);

initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <Button onClick={() => toggleModal(true)}>
        Open Sheet to see <strong>Custom Header</strong>
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        headerContent={customHeader}
    >
        <p>Notice below at the very bottom here there is a footer!</p>
    </Sheet>
</div>
```


## Example With `maskOpacity` Prop

The `maskOpacity` prop sets how dark the `Sheet`'s backdrop is. This prop takes a decimal value. The below example allows you to select a `maskOpacity` value, and you can see the value in action by clicking the "Open Sheet" button.

```jsx
// Let's set this example's maskOpacity to the default
// value of 0.5, but let you adjust this with the
// select element below.
initialState = {
    maskOpacity: 0.5,
    modalIsOpen: false
};
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <select
        onChange={(e) => setState({maskOpacity: parseFloat(e.target.value)})}
        style={{'display': 'block'}}
    >
        <option value='0'>`0` mask opacity</option>
        <option value='0.15'>`0.15` mask opacity</option>
        <option value='0.5' defaultValue>default (`0.5`) mask opacity</option>
        <option value='0.85'>`0.85` mask opacity</option>
        <option value='1'>`1` mask opacity</option>
    </select>

    <Button onClick={() => toggleModal(true)}>
        Open Sheet with custom `maskOpacity`
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        maskOpacity={state.maskOpacity}
    >
        <Button
            className="u-width-full"
            onClick={() => toggleModal(false)}
        >
            Close Sheet
        </Button>

        <p>Prevailed sincerity behaviour to so do principle mr. As departure at no propriety zealously my. On dear rent if girl view. First on smart there he sense. Earnestly enjoyment her you resources. Brother chamber ten old against. Mr be cottage so related minuter is. Delicate say and blessing ladyship exertion few margaret. Delight herself welcome against smiling its for.</p>
    </Sheet>
</div>
```


## Example With `prerender` Prop

Sheet components hide their contents when the aren't active. But there are certain circumstances where it may be preferable that the contents render regardless of whether the sheet is active or not.

For example, navigation components that are in a sheet would be hidden from from search engine crawlers, thus the `prerender` prop is a way to allow search engine crawlers to see the navigation even when the navigation sheet is inactive.

```jsx
initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <Button onClick={() => toggleModal(true)}>
        Open Sheet
    </Button>

    <p>Use your browser inspector to inspect the pre-rendered content.</p>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        prerender={true}
    >
        <p>
            Notice that this content renders to the DOM whether or not this modal is actually active or not!
        </p>
    </Sheet>
</div>
```


## Example With `shrinkToContent` Prop

Passing the `shrinkToContent` prop will make the modal shrink to the size of its content. This is commonly used for modals that are very brief, such as a "Thank You!" message after submitting a form.

```jsx
initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <Button onClick={() => toggleModal(true)}>
        Open the `shrinkToContent` Sheet
    </Button>
    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        effect="modal-center"
        shrinkToContent
    >
        <h2>Demonstration of `shrinkToContent`</h2>
        <p>Short content</p>
    </Sheet>
</div>
```


## Example With `title` Prop

`title` text is added to the `sheet` header as an `<h1>` element. This can be added even if you are passing components into the `headerContent` prop, in which case the `title` is added before the `headerContent`.

In either case, it is advisable to always at least provide an `<h1>` title in your `sheet` components to ensure they are accessible to screen reader users.

```jsx
initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};

<div>
    <Button onClick={() => toggleModal(true)}>
        Open Sheet to view custom title
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        title="See my custom title here!!!"
    >
        <p>Notice the custom title above!</p>
    </Sheet>
</div>
```

Note that a `Sheet` can have both a `title` **and** a `headerContent` prop. They will both be visible:

```jsx
initialState = { modalIsOpen: false };
const toggleModal = (bool) => {
    setState({modalIsOpen: bool})
};
const customHeader = (
    <div
        className="u-flexbox"
        style={{ background: '#ff852c' }}
    >
        <div className="u-flex">
            I am a custom Header!
        </div>
        <div>
            <Button onClick={() => toggleModal(false)}>
                Close
            </Button>
        </div>
    </div>
);

<div>
    <Button onClick={() => toggleModal(true)}>
        Open Sheet to view custom `title` AND custom `headerContent`
    </Button>

    <Sheet
        open={state.modalIsOpen}
        onDismiss={() => toggleModal(false)}
        title="See my custom title here!!!"
        headerContent={customHeader}
    >
        <p>Notice that there is both a custom title and a custom header above!</p>
    </Sheet>
</div>
```
