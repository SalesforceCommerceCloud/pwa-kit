```js static
// JS import
import BazaarvoiceReview from 'progressive-web-sdk/dist/components/bazaarvoice-review'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/bazaarvoice-review/base';
```


## Example Usage
This will render the Bazaarvoice reviews for the given product ID. If you need to make visual modifications to the appearance of these reviews, override the default CSS styles.

```js static
<BazaarvoiceReview productId={productId} apiSrc={src} />
```

### BazaarVoice API v2

The `BazaarvoiceReview` component supports version 2 of the BazaarVoice API. 
To use version 2, the prop `apiVersion='2'` needs to be set
and the `apiSrc` needs to be updated to API v2 URL.

```js static
<BazaarvoiceReview productId={productId} apiSrc={src} apiVersion='2' />
```

## Custom Components
The `BazaarvoiceReview` component ensures that the Bazaarvoice API script is only loaded once, regardless of how many `BazaarvoiceReview` components are mounted. This is done using a higher order component called `BazaarvoiceWrapper`.

It's possible to use `BazaarvoiceWrapper` to create your own custom Bazaarvoice components. You may want to do this to add a `BazaarvoiceQuestions` component, for example. Your custom component would look something like this:

```js static
import bazaarvoiceWrapper from 'progressive-web-sdk/dist/components/bazaarvoice-wrapper'

class CustomBazaarvoiceComponent extends React.Component {
    componentDidMount() {
        // Perform any necessary setup, such as calling window.$BV.ui
    }

    render() {
        // Render the required container here
    }
}

export default bazaarvoiceWrapper(CustomBazaarvoiceComponent)
```

You could then use your `CustomBazaarvoiceComponent` like so:

```js static
<CustomBazaarvoiceComponent apiSrc={src} {...additionalProps} />
```
