```js static
// JS import
import SkeletonText from 'progressive-web-sdk/dist/components/skeleton-text'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/skeleton-text/base';
```


## Why use Skeleton components?
Skeleton components are used to mimic content that may take a while to appear. The most common case of this is any content
that is loaded over the network via a parser. In these cases, the page will render faster than the actual content can display
and it's important to tell the user that content is on it's way. Skeleton components should not be used in cases where the
content their mimicking will be ready on page render or in a very short time period afterwards. Only content that can take an
indeterminate amount of time should leverage a skeleton implementation.

## Where this skeleton component is useful
This type of skeleton component is best used in places where multiple lines of text need to be mimicked,
such as paragraphs or blocks of information.

## SDK Uses
Currently, the SkeletonText is being utilized by the following SDK components: _None so far!_

## Potential SDK Use Cases
Places where this skeleton component may be useful, but hasn't been implemented yet: _None so far!_

## Example Usage
*Default*

```jsx
<SkeletonText />
```

*5 Lines of `<h1>` text*

```jsx
<SkeletonText type="h1" lines={5} width="50%" />
```

*3 Lines of text with custom line height*

```jsx
<SkeletonText lines={3} width="50%" style={{lineHeight: '2em'}} />
```
