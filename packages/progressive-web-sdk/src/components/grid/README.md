```js static
// JS import
import {Grid, GridSpan} from 'progressive-web-sdk/dist/components/grid'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/grid/base';
```

## Example usage

The `Grid` component by itself doesn't do a whole lot by itself, it's a wrapper
container for the child `GridSpan` components. The `GridSpan` component is where
you are able to control the grid's layout based on the three available
breakpoints defined in the project's stylesheet. The `Grid` uses the [Susy mixin
library](http://susydocs.oddbird.net/en/latest/toolkit/) for it's layout.

```jsx
<Grid className="t-example-template">
    {/*
        Note that omitting the `span` prop will default the GridSpan to
        full width!
    */}

    <GridSpan className="t-example-template__promo"
        mobile={{span: null}}
        tablet={{span: 6, pre: 1, post: 1}}
        desktop={{span: 6, pre: 3, post: 3}}
    >
        <strong>Full Content:</strong>
    </GridSpan>

    <GridSpan className="t-example-template__main"
        mobile={{span: null}}
        tablet={{span: 6, pre: 1, post: 1}}
        desktop={{span: 7}}
    >
        <strong>Main Content:</strong>
    </GridSpan>

    <GridSpan className="t-example-template__aux"
        mobile={{span: null}}
        tablet={{span: 6, pre: 1, post: 1}}
        desktop={{span: 5}}
    >
        <strong>Auxiliary Content:</strong>
    </GridSpan>

</Grid>
```


## Breakpoint modifiers

As you can see in the above props table, there are three breakpoint props:
`mobile`, `tablet` and `desktop`. Into each of these props can be passed an
object with properties that define the `GridSpan`'s behavior at that
breakpoint. The table below describes what behaviors can be defined:

| Name | Type | Description |
| --- | --- | --- |
| `span` | Number | Designates how many columns the current `GridSpan` component will occupy. |
| `pre` | Number | Designates how much `margin-left` should be added to the current `GridSpan` component in number of columns. |
| `post` | Number | Designates how much `margin-right` should be added to the current `GridSpan` component in number of columns. |

How many columns that can be "spanned", "pre'ed" or "post'ed" depends on the
breakpoint: by default `mobile` has a total of 4 columns, `tablet` has 8 columns,
and `desktop` 12 columns. If no `span` property is provided, the `GridSpan` will
default to a full width span.

## Customizing column count

The number of columns there are for each breakpoint can be customized in the
`GridSpan`'s `grid-span.jsx` file and `_variable.scss` file.

```js static
// app/components/grid/grid-span.jsx
const MOBILE_COLUMN_COUNT = 6   // defaults to 4
const TABLET_COLUMN_COUNT = 10  // defaults to 8
const DESKTOP_COLUMN_COUNT = 12 // 12 is the default
```

```scss static
// app/componeonts/grid/_base.scss
$mobile-column-count: 6;   // defaults to 4
$tablet-column-count: 10;  // defaults to 8
$desktop-column-count: 12; // 12 is the default
```
