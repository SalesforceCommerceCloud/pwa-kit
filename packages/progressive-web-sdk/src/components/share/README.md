```js static
// JS import
import Share from 'progressive-web-sdk/dist/components/share'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/share/base';
```

## Example Usage

```jsx
<Share
    open={state.open}
    onShow={() => setState({open: true})}
    onDismiss={() => setState({open: false})}
/>
```

## Example With `triggerElement`
The `triggerElement` prop allows for an existing or custom component to trigger the `Share` sheet.

*With a custom component*

```jsx
const customTriggerElement = (
    <button>
        <IconLabel
            label="Share"
            iconName="share"
        />
    </button>
);

<Share
    open={state.open}
    onShow={() => setState({open: true})}
    onDismiss={() => setState({open: false})}
    triggerElement={customTriggerElement}
/>
```
