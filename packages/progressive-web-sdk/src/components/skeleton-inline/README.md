```js static
// JS import
import SkeletonInline from 'progressive-web-sdk/dist/components/skeleton-inline'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/skeleton-inline/base';
```


## Why use Skeleton components?
Skeleton components are used to mimic content that may take a while to appear. The most common case of this is any content
that is loaded over the network via a parser. In these cases, the page will render faster than the actual content can display
and it's important to tell the user that content is on it's way. Skeleton components should not be used in cases where the
content their mimicking will be ready on page render or in a very short time period afterwards. Only content that can take an
indeterminate amount of time should leverage a skeleton implementation.

## Where this skeleton component is useful
This type of skeleton component is best used in places where an inline piece of content (such as text) needs
to be mimicked, like in the Breadcrumbs or List components.

## SDK Uses
Currently, the SkeletonInline is being utilized by the following SDK components: _[SkeletonText](#!/SkeletonText)_

## Potential SDK Use Cases
Places in the SDK where this skeleton component may be useful, but hasn't been implemented yet:
_[Breadcrumbs](#!/Breadcrumbs)_, _[Link](#!/Link)_, _[ListTile](#!/ListTile)_, _[List](#!/List)_

## Example Usage

*Defaults*

```jsx
<SkeletonInline />
```

*25% width, size of 12px*

```jsx
<SkeletonInline width="25%" size="12px" />
```

*50% width, size of 20px*

```jsx
<SkeletonInline width="50%" size="20px" />
```

*`<p>` element skeleton*

```jsx
<SkeletonInline type="p" width="50%" size="20px" />
```
