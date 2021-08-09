```js static
// JS import
import ReviewSummary from 'progressive-web-sdk/dist/components/review-summary'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/review-summary/base';
```


## Example Usage

```jsx
<ReviewSummary
    ratingProps={{
        className: 'pw--solid',
        count: 3,
        total: 5
    }}
    imageProps={{
        src: "https://librestock.com/media/thumbs/cat-984367_640.jpg",
        width: "88px",
        height: "88px",
        alt: "cat"
    }}
    summary= "3/5 stars"
    text= "71% of 12 reviewers would recommend this product to a friend."
/>
```
