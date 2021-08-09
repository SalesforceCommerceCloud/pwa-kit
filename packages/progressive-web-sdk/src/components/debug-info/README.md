`DebugInfo` assists developers by bringing key information about the build together into one place:

- `bundleID` of the build
- `Origin` of the build
- `RenderPhase`, the build’s current rendering phase
- `ProgressiveWebSDK`, version of the Mobify Platform
- Build info events

```js static
// JS import
import DebugInfo from 'progressive-web-sdk/dist/components/debug-info'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/debug-info/base';
```

## Example Usage

The screenshots below introduce the `DebugInfo` component.

*Without* the SSR timing information expanded (if available):

![](../../assets/images/components/debug-info/debug-info.png)

*With* the SSR timing information expanded (if available):

![](../../assets/images/components/debug-info/debug-info-opened.png)

<div class="c-callout">
 <p>
   <strong>Note:</strong> Note: SSR Timing information is only available on Mobify server-side rendered Progressive Web App (PWA) builds.
 </p>
</div>
&nbsp;&nbsp;

The default Component implementation:
```jsx static
    <DebugInfo />
```

