The InlineAsk component can be added to your Progressive Web App to subscribe the
visitor to push notifications. When the "Opt In" button is tapped, the browser
will ask the visitor if push notifications should be allowed.

If the visitor blocks push notifications, the component will still display the
"Opt In" button, but it displays an in-app notification that lets them know push
notifications are currently blocked.

```js static
// JS import
import InlineAsk from 'progressive-web-sdk/dist/components/inline-ask'
```

## Example Usage

```html static
<InlineAsk
    buttonText="Opt In"
    descriptionText="Get notified on all the latest deals, promotions and new products."
    successText="Successfully subscribed"
/>
```
