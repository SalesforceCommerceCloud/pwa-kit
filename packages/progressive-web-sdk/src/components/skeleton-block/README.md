```js static
// JS import
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/skeleton-block/base';
```


## Why use Skeleton components?
Skeleton components are used to mimic content that may take a while to appear. The most common case of this is any content which is loaded over the network. In these cases, the page will render faster than the actual content can display and it's important to tell the user that content is on its way. Skeleton components should not be used in cases where the content they're mimicking will be ready on page render or in a very short time period afterwards. Only content that can take an indeterminate amount of time should leverage a skeleton implementation.

For more information, check out our article on [Creating Instant Page Transitions](../../../guides/instant-page-transitions/).

## SDK uses
Currently, SkeletonBlock is being used by the following SDK components: _[Image](#!/Image)_

## Example usage

*Defaults with custom height*

```jsx
<SkeletonBlock height="100px" />
```

*Custom height & width*

```jsx
<SkeletonBlock width="50%" height="50px" />
```

*Custom height, width & styling*

```jsx
<SkeletonBlock style={{borderRadius: '100%'}} width="100px" height="100px" />
```

*Custom element type*

```jsx
<SkeletonBlock type="img" width="75px" height="75px" />
```
