```js static
// JS import
import Icon from 'progressive-web-sdk/dist/components/icon'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/icon/base';
```

## Pre-Requisite: SVG Icon Sprite

In order for the `Icon` component to work, an SVG icon sprite must be loaded
into the page that the Icon component is used in. The icon sprite technique used
is the same as [the one described by CSS Tricks](https://css-tricks.com/svg-sprites-use-better-icon-fonts/),
combined with an [external SVG reference file](https://css-tricks.com/svg-use-with-external-reference-take-2/)
for caching. It is even possible to have multiple icon sprites (see the section
below called "Example Extra Icon Sprite").

```jsx static
// It's recommended that the sprite value come from the Redux store, which will
// be updated after a successful Ajax request.
const externallyLoadedSpriteXml = this.props.sprite

// Add this to the app once in a high level place, such as a global template
// wrapper like `~/app/containers/app/container.js`. This way the sprite will
// only be loaded once, and will be available across all pages and components.
<DangerousHTML html={externallyLoadedSpriteXml}>
    {(spriteString) => <div hidden dangerouslySetInnerHTML={spriteString} />}
</DangerousHTML>

// Once the above DangerousHTML is populated the sprite prop, Icon can be used
<Icon name="cart" />
```

## Available Icons

All available icons are stored inside a project's `web/app/static/svg/sprite-source` directory. To use an icon from that directory, set the `name` prop of the icon to the filename without the `.svg` extension. For example, to use the icon called `zoom.svg`, you could use the following:

```jsx
<Icon name="zoom" />
```

## Adding New Icons

To add new icons to your project, place the svgs inside the `web/app/static/svg/sprite-source` directory. Then, run the command `npm run build-sprites`. This will optimize your svgs and add them to the SVG icon sprite.

## Example Usage

```jsx
<Icon name="cart" title="Screen Readers read me, but not the next icon" />
```

**Icons** should be treated like images: they should have accessible titles for
screen readers. To do so, the `title` attribute must be filled with useful text.

If no `title` is provided, the icon will be intentionally hidden from screen
readers **and** be unfocusable. In otherwords, it will be `aria-hidden: true`.

## Example for Different `size`

Icons can take in a `size` prop. Common values include `small`, `medium` and
`large`.

```jsx
<div>
    <Icon name="cart" size="small" />
    <Icon name="cart" size="medium" />
    <Icon name="cart" size="large" />
</div>
```

However, you can provide any string value into `size` and use its corresponding
class to customize its appearance in any project you use. For example:

```jsx
<div>
    <Icon name="cart" size="microscopic" />
    <Icon name="cart" size="gargantuan" />
    <Icon name="cart" size="colossal" />
</div>
```

## Example Extra Icon Sprite

It's possible to have multiple icon sprites at once. Simply add the icon sprite
to your page by the method of your choice. An SVG sprite's symbols' should have
unique, prefixed IDs (ex. 'id="custom-blob"'). Then you can use the Icon
component's `prefix` and `name` props to reference your new icon sprite symbols.

```jsx
<div>
	<div style={{display: 'none'}}>
        {/*
            Here we add the icon sprite via a JSX SVG component. We hide it in
            order to prevent it from visually rendering itself.
        */}
        <svg>
            {/*
                Notice that our id is `#custom-oval`, which we will reference
                using both the Icon component's `prefix` and `name` props.
            */}
            <symbol id="custom-oval">
                <g fill="#FF0000"><circle id="Oval" cx="8" cy="8" r="8" /></g>
            </symbol>
        </svg>
    </div>

    {/*
        The prefix and name will combine to `#custom-oval`. Beware, if you don't
        declare a custom prefix, the Icon component assumes the prefix is `pw`,
        which is the default value
    */}
    <Icon prefix="custom" name="oval" />
</div>
```
