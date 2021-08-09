```js static
// JS import
import Popover from 'progressive-web-sdk/dist/components/popover'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/popover/base';
```


## Example Usage

Each `Popover` has a trigger element that toggles internal state to manage
whether it should be visible or not. `Popover` triggers can be styled however you
wish, but are always wrapped in unstyled `<button>` elements.

```jsx
<Popover trigger="I'm a generic trigger!">
    Hello! I'm the content of a popover that has a generic, unstyled, trigger and caret.
</Popover>
```

You can pass `caretPosition` prop that allows you to change the position of the
caret at the top of the `Popover`. The default position is `left` and doesn't need
to be supplied.

```jsx
<Popover
    caretPosition="center"
    trigger="Centered Caret and Styled Trigger 🎈"
    triggerClassName="u-border"
>
    Hello! I'm the content of a popover that has a center-aligned caret and a styled trigger.
</Popover>
```


```jsx
<Popover
    className="u-width-full"
    caretPosition="right"
    trigger="Right Caret and Styled Trigger 👉"
    triggerClassName="u-bg-color-error u-width-full"
>
    Hello! I'm the content of a popover that has a right-aligned caret and a styled trigger.
</Popover>
```

## `triggerElement` prop

The `triggerElement` prop allows HTML elements and React components to be the element that triggers the popover. 
Custom HTML elements and React components can be used as triggers for the Popover.

__Note__: React components need to support `onMouseDown`, `onFocus`, `onBlur`, `onMouseEnter`, and `onMouseLeave` event handlers in order to use the popover.

This example uses a standard HTML input element as the trigger element for the popover.

```jsx
<Popover
    className="u-width-full"
    caretPosition="left"
    trigger="Custom Input Trigger"
    triggerClassName="u-width-full"
    triggerElement={<input name="exampleInput" type="text" defaultValue="Hello" placeholder="I am an Input" required={true} />}
>
    Hello! I'm the content of a popover that uses an input element trigger.
</Popover>
```

This example uses a basic `<input>` HTML element with the `isHover` prop.

```jsx
<Popover
    className="u-width-full"
    caretPosition="left"
    trigger="Custom Input Trigger With Hover"
    triggerClassName="u-width-full"
    triggerElement={<input name="exampleInput" type="text" defaultValue="Hello" placeholder="I am an Input" required={true} />}
    isHover={true}
>
    Hello! I'm the content of a popover that uses an input element trigger and Hover.
</Popover>
```

This example uses our `Link` component wit the `isHover` prop.

```jsx
<Popover
    className="u-width-full"
    caretPosition="left"
    trigger="Link SDK Component Trigger"
    triggerClassName="u-width-full"
    triggerElement={
        <Link href="http://google.com/" text="Go to Google" />
    }
    isHover={true}
>
    Hello! I'm the content of a popover that uses the SDK Link component.
</Popover>
```