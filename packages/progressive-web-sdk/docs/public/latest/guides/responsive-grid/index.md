Until all commonly used browsers support the <a href="https://www.w3.org/TR/css-grid-1/" target="_blank">CSS Grid Layout</a>, the Mobify SDK needs to provide a default for responsive projects. A consistent system makes things simpler for everyone.

## Grid & GridSpan components deprecated

Since version 1.2, the **Grid** and **GridSpan** components were **deprecated**. In their place, you can use the Susy responsive library. This article will walk you through everything you need to know about using Susy for your responsive grid system.

## Introduction <a name="introduction" href="#introduction">#</a>

Until all common browsers support the <a href="https://www.w3.org/TR/css-grid-1/" target="_blank">CSS Grid Layout</a>, the Mobify SDK needs to provide a default for responsive projects. A consistent system makes things simpler for everyone.

This guide will introduce you to the Mobify responsive grid library, <a href="http://oddbird.net/susy/docs/" target="_blank">Susy 3</a>, and suggest some best practices. You'll also find sample code implementations that you can use in your projects.

## Responsive Best Practices

If you haven't already, <a href="https://github.com/mobify/mobify-code-style/tree/develop/css/responsive-best-practices" target="_blank">read about Mobify's Responsive Best Practices</a>.

The SDK has some default breakpoints in place for you in `_variables.scss`: `$medium-breakpoint`, `$large-breakpoint`, and `$x-large-breakpoint`. These names are Mobify convention and will be used in the examples below.

## Why Susy?

<a href="http://oddbird.net/susy/" target="_blank">Susy</a> is a SASS library that helps you build readable and robust responsive grid systems. The library has been developed and maintained for over 8 years by <a href="http://www.miriamsuzanne.com/" target="_blank">Miriam Suzanne</a>, a prominent contributor in the web development community.

We've chosen Susy for a number of reasons:

- It follows familiar <a href="https://sass-lang.com/documentation/file.SASS_REFERENCE.html" target="_blank">Sass conventions</a>
- It's actively maintained, with a large support community
- It can be set up to mimic the implementation of <a href="https://www.w3.org/TR/css-grid-1/" target="_blank">CSS Grid</a>
- It supports `float` and `flex` layouts

## Getting Started

### Susy Setup

Susy is already installed for you as a Node package. In your project's `_variables.scss`, you'll find a `$susy` Sass map that sets a couple defaults. <a href="http://oddbird.net/susy/docs/config.html#variable--susy" target="_blank">Read more about these options, and others you can set</a>.

```SASS
// Responsive Grid Configuration
$susy: (
    columns: susy-repeat(4),
    gutters: 12px
);
```

**Columns**: This is the number of columns in your layout.

**Gutters**: This is the width of your gutters/margins. Providing the value **without units** will give you fluid gutters. For example, using `0.5` will give you a fluid gutter half (0.5) the size of a single column, while `12px` will give you a static gutter that's 12px wide.

This is all you need to set up to start [using Susy](#grid-usage)! For projects that use different grids depending on device width, read on below for a bit more setup.

## Adding Breakpoints

The basic setup is now complete! For projects that use different grids depending on device width, read on below for a bit more setup. Otherwise, jump ahead to start [using Susy](#grid-usage).

**1. Set up a configuration for each non-default grid layout**
<a name="layout-config" href="#layout-config"></a>
If you want to switch to a _12 column_ grid with _24px gutters_ at your _large breakpoint_, you might add the following code to `_variables.scss`:

```SCSS
$large-config: (
    columns: susy-repeat(12),
    gutters: 24px
)
```

_Note: Your "default" grid configuration is what you have declared in your `$susy` map._

You can add as many _configs_ as you want: these are just alternate versions of the "default" `$susy` map. Make sure to follow the `${breakpoint}-config` naming convention, where _breakpoint_ is the name of your breakpoint.

**2. Use susy-breakpoint in place of a regular media query**

The `susy-breakpoint` <a href="https://sass-lang.com/documentation/file.SASS_REFERENCE.html#mixins" target="_blank">mixin</a> replaces a traditional media query (e.g.: `@media screen ...`) and takes two arguments: a [breakpoint](https://github.com/mobify/mobify-code-style/tree/develop/css/responsive-best-practices#use-4-or-less-major-breakpoints) and a [config](#layout-config) that you've defined.

It will output an `@media` block that has a [config's](#layout-config) values scoped within it. We've set up our `$large-config` variable above, so now we can use it in the mixin along with our `$large-breakpoint` variable:

```SCSS
// _cool-component.scss

.c-cool-component {
    ...
}

@include susy-breakpoint($large-breakpoint, $large-config) {
    .c-cool-component {
        ...
    }
}
```

**3. Bonus step**

If you'd like, you can use Sass's [variable arguments](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#variable_arguments) to group your breakpoint and config variables together. For example, we could group the `$large-breakpoint` together with the `$large-config`:

```SCSS
// _variables.scss

// Breakpoint Variables
$large-breakpoint: 1000px;

// Breakpoint Layouts
$large-config: (columns: susy-repeat(12), gutters: 24px);

// Susy-Breakpoint Variables
$large: $large-breakpoint, $large-config;


// _cool-component.scss

.c-cool-component {
    ...
}

@include susy-breakpoint($large...) {
    .c-cool-component {
        // ✨MaGiC✨
        ...
    }
}
```

Remember to keep your responsive variables and grid variables grouped together!

## Grid Usage

Now that we're all set up, it's time to use Susy!

### Span

Use the [`@span`](http://oddbird.net/susy/docs/api.html#function--susy-span) function to set an element to span a number of columns. You can use it with `width`, `flex-basis`, `margin`, or any other CSS rule that accepts a number. If you pass a parameter larger than `1`, Susy will add in intermediate gutter spacing.

```SCSS
.c-cool-component {
    float: left;
    // 2-up on an 8 column grid, with added spacing
    // for 3 intermediate gutters
    width: span(4);
}
```

The Susy docs explain how to [add more parameters for context, nesting and other use cases](http://oddbird.net/susy/docs/api.html#function--susy-span).

_Note: Susy2 included a [`container` mixin](http://susy.readthedocs.io/toolkit/#container) that helped clearfix for your floats, but this was removed in Susy3. If you're using Susy with `float`, we've built our own `@include container` mixin into the SDK that provides similar functionality. It gets imported into your project in `app/stylesheet.scss` along with the other Susy mixins._

### Gutter

Use the [`@gutter`](http://oddbird.net/susy/docs/api.html#function--susy-gutter) function to add gutter math to a CSS rule. For example, adding `margin-right: gutter()` to a component will set the `margin-right` of that element to be the width of a gutter. We started setting up our layout in the example above, but we did not yet add gutter spacing between each instance of _cool-component_. We can use `gutter` to do that:

```SCSS
.c-cool-component {
    float: left;
    width: span(4); // 2-up on an 8 column grid
    margin-right: gutter(); // add in the gutter

    &:nth-child(2n) {
        margin-right: 0; // remove the gutter on the last item
    }
}
```

[Read more about the `gutter` function on the Susy docs.](http://oddbird.net/susy/docs/api.html#function--susy-gutter)

## Examples

Below, you'll find additional examples of how you might use Susy in your project.

### Components

Easily make your components responsive:

```SCSS
// We want 2-up styling on smaller screens where our grid is 8 columns wide,
// and 4-up styling on larger screens that use a 12 column grid.

.c-cool-component {
    float: left;
    width: span(4);
    margin-right: gutter();

    &:nth-child(2n) {
        margin-right: 0
    }
}

@include susy-breakpoint($large...) {
    .c-cool-component {
        width: span(3);

        &:nth-child(4n) {
            margin-right: 0;
        }
    }
}
```

### Templates

Use Susy for layouts or component adjustments:

```SCSS
// We want to add a sidebar to our template, and make sure that our
// component fills up the rest of the space in the 8 column grid.

.t-template__sidebar {
    float: left;
    width: span(2);
    margin-right: gutter();
}

.t-template {
    .c-cool-component {
        float: right;
        width: span(6);
    }
}
```

### Utility Classes

Use Susy for one-off styling! For example, you could implement this as an alternative to the solution above:

```SCSS
// utilities/_grid.scss

.u-grid-span-6 {
    width: span(6);
    margin-right: gutter();
}

.u-grid-last {
    margin-right: 0;
}
```

```js
// template.jsx
<section className="t-template__main">
    <CoolComponent className="u-grid-span-6 u-grid-span-last" />
</section>
<aside className="t-template__sidebar">...</aside>
```

## FAQ

#### Q: Do I need to use @susy-breakpoint for all my media queries?
A: `@susy-breakpoint` is only necessary if you are planning on using Susy functions that depend on certain grid math in your query. Otherwise, feel free to use `@media` for your queries.

#### Q: Where can I go if I need help answering a question?
A: If you can't find the answer here, try checking the <a href="http://oddbird.net/susy/docs/index.html" target="_blank">Susy Docs</a>, or do a search on <a href="https://stackoverflow.com" target="_blank">StackOverflow</a>.

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>
