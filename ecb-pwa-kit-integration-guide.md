# Integrate Embedded Content Blocks with PWA Kit

**Embedded Content Blocks (ECB)** let a content manager place Page Designer content blocks into fixed slots of your storefront chrome — regions your React layout owns and renders on *every* page, like an announcement bar above the header — rather than only inside a Page Designer *page*. The content is authored in the Content Workspace and edited in the same focused visual canvas as the Content Block Editor (CBE), but it renders **inline in your live storefront layout**, not in an isolated preview route.

The canonical example, and the one this guide builds, is an **embedded header**: a singleton Page Designer component (instance id `header`) that exposes a single `announcement` region above your storefront's header. A merchandiser drops an **Announcement Banner** content block into that region; every page of the storefront then renders it, and it stays editable in CBE.

This guide assumes you have **already followed the [Content Block Editor (CBE) guide](#see-also)** — the preview route, the synthetic-page helper, the registry/type-map mechanics, the `PageDesignerProvider` wiring, and the SSR `default`-locale redirect are all prerequisites here. ECB adds a small amount on top of that foundation:

1. A **`useComponent` fetch of a singleton component** in your app shell, rendered inline through `<Region>`.
2. An **`EmbeddedSubtreeProvider`** wrapper (new in `storefront-next-runtime@1.2.0`) that tells the design runtime this subtree is embedded chrome, not a page.
3. Two new **components** — an embedded `Header` layout and an `AnnouncementBanner` content block — plus their registry/type-map entries.
4. Two new **cartridge descriptors**, one of which uses the ECB-specific `"embedded": true` flag and an explicit `component_id`.

Like CBE, ECB is a **paired effort across two systems**: the **PWA Kit (React) side** (the components, the shell wiring, the registry) and the **Commerce Cloud (cartridge) side** (the descriptors you author and upload). Neither half works alone.

---

## Prerequisites

- **A completed CBE + PWA Kit integration.** Everything in the CBE guide is assumed: the `/preview/component` route, `injectIntoPreviewRegion`, `PAGEDESIGNER_TO_COMPONENT`, `initializeRegistry()`, the `PageDesignerProvider` shell, and the SSR `default`-locale redirect. This guide does not repeat them.
- **`@salesforce/commerce-sdk-react`** with the `useComponent` hook (the same version the CBE guide requires). Import `useComponent` from the **package root**; import `Region`/`Page`/`registry`/`PageDesignerProvider` from the **`/page-designer` subpath**.
- **`@salesforce/storefront-next-runtime@1.2.0`** or later — this is the version that exports **`EmbeddedSubtreeProvider`** from `@salesforce/storefront-next-runtime/design/react/core`. ECB will not work on `0.4.2`.
- **Node 24** for tooling and local dev.
- A **SLAS client with the `sfcc.shopper-experience` scope** — `useComponent` calls the Shopper Experience `getComponent` endpoint.

**Import boundary — the same rule as CBE, plus one new entry point:**

- `useComponent` → `import {useComponent} from '@salesforce/commerce-sdk-react'` (package root).
- `Region` → `import {Region} from '@salesforce/commerce-sdk-react/page-designer'` (subpath).
- `EmbeddedSubtreeProvider` → `import {EmbeddedSubtreeProvider} from '@salesforce/storefront-next-runtime/design/react/core'` (runtime design subpath — **not** re-exported through `commerce-sdk-react`).

---

## Architecture Overview

ECB differs from CBE in *where the component renders*. CBE renders one component chrome-free at a dedicated preview route. ECB fetches a singleton component in your app shell and renders it **inline in the storefront layout**, on every page, wrapped in `EmbeddedSubtreeProvider`.

```
Content Workspace (CC 26.8)
        │  author the embedded `header` component + its `announcement` region
        │  drop an Announcement Banner block into the region
        ▼
Storefront request (any page — SSR + client)
        │
        ▼
_app: StorefrontApp
   • useComponent({parameters:{componentId:'header'}})   ← fetch the singleton
   • useComponent is Page-Designer-mode aware (handles mode/pdToken internally)
        │
        ▼
   render, above <AboveHeader/> and <Header/>:
   <EmbeddedSubtreeProvider embedded>
       <Region component={embeddedHeader} regionId="announcement" />
   </EmbeddedSubtreeProvider>
        │
        ▼
   <Region> resolves each child by typeId via the registry:
       commerce_assets.announcementBanner → <AnnouncementBanner/>
        │
        ▼
   Announcement banner renders inline above the header, on every page,
   and stays editable in CBE (via the shared PageDesignerProvider + preview route)
```

**Key differences from CBE:**

- **No dedicated route.** The embedded component renders in the normal storefront shell, on every page.
- **A singleton component id.** The header is fetched by a fixed `componentId` (`'header'`), not one supplied per-request.
- **`EmbeddedSubtreeProvider` wraps the embedded subtree** so the design runtime treats it as embedded chrome — this is the new piece ECB adds.
- **The descriptor is `"embedded": true`** with an explicit `component_id`, which is what makes it a singleton the storefront can fetch by a known id.

---

## Step 1 — Add the embedded `Header` layout component

The embedded header holds no chrome of its own — your storefront's existing `Header`/`AboveHeader` remain the visual header. This component's only job is to expose the `announcement` region so content managers have somewhere to drop blocks. It is a thin `<Region>` pass-through.

```jsx
// file: app/page-designer/layouts/header/index.jsx

/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Region} from '@salesforce/commerce-sdk-react/page-designer'

/**
 * Embedded Header component.
 *
 * A singleton Page Designer component (instance id `header`) whose sole purpose is to
 * expose an `announcement` region above the storefront header. It holds no chrome of its
 * own — the storefront's own `Header`/`AboveHeader` remain the visual header. Authors place
 * content blocks (e.g. Announcement Banner) into the `announcement` region.
 *
 * @param {object} props
 * @param {object} props.component - The Page Designer component data (injected by the V2 pipeline).
 * @returns {React.ReactElement|null} - The rendered announcement region, or null when absent.
 */
export const Header = ({component}) => {
    return <Region component={component} regionId="announcement" />
}

Header.propTypes = {
    component: PropTypes.object.isRequired
}

Header.displayName = 'PageDesignerHeader'

export default Header
```

**Key points:**

- **It renders a single named region.** `<Region component={component} regionId="announcement" />` renders whatever content blocks a merchandiser placed in the `announcement` region of this component instance.
- **`component` is required.** When the V2 pipeline renders this component (via `<Region>`/`<Component>`), it injects the component's own data as the `component` prop; you pass it straight to the nested `<Region>`.
- **Export it from the layouts barrel** so the component map can import it (Step 4).

---

## Step 2 — Add the `AnnouncementBanner` content block

This is the actual content block a merchandiser drops into the header's `announcement` region. It is a leaf component: no regions, just editable attributes.

```jsx
// file: app/page-designer/content/announcement-banner/index.jsx

/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Skeleton,
    Text,
    Link as ChakraLink
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'

const HEIGHT_STYLE = {
    sm: {py: 1.5, fontSize: 'xs'},
    md: {py: 3, fontSize: 'sm'},
    lg: {py: 5, fontSize: 'md'}
}

const ALIGNMENT_JUSTIFY = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
}

const COLOR_SCHEME_STYLE = {
    primary: {bg: 'blue.600', color: 'white'},
    secondary: {bg: 'gray.100', color: 'gray.800'},
    destructive: {bg: 'red.600', color: 'white'}
}

const normalize = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback)

/**
 * Announcement Banner component.
 *
 * A banner for announcements, promotions, and alerts. Rendered as an authorable
 * content block; typically placed in the embedded header's `announcement` region.
 *
 * @param {object} props
 * @param {string} props.message - The announcement text (required; renders nothing when empty).
 * @param {string} [props.linkUrl] - Optional link target. Rendered only with linkText.
 * @param {string} [props.linkText] - Optional link label. Rendered only with linkUrl.
 * @param {string} [props.colorScheme] - primary | secondary | destructive (default primary).
 * @param {string} [props.height] - sm | md | lg (default md).
 * @param {string} [props.alignment] - left | center | right (default center).
 * @returns {React.ReactElement|null} - AnnouncementBanner component.
 */
export const AnnouncementBanner = ({
    message,
    linkUrl,
    linkText,
    colorScheme,
    height,
    alignment
}) => {
    if (!message) return null

    const heightStyle = HEIGHT_STYLE[normalize(height, ['sm', 'md', 'lg'], 'md')]
    const resolvedAlignment = normalize(alignment, ['left', 'center', 'right'], 'center')
    const colorStyle =
        COLOR_SCHEME_STYLE[
            normalize(colorScheme, ['primary', 'secondary', 'destructive'], 'primary')
        ]

    const isAbsolute = isAbsoluteURL(linkUrl)
    const LinkWrapper = isAbsolute ? ChakraLink : Link
    const linkProps = isAbsolute ? {href: linkUrl} : {to: linkUrl}

    return (
        <Box
            role="status"
            className={'announcement-banner'}
            data-testid={'announcement-banner'}
            display="flex"
            alignItems="center"
            gap={2}
            px={{base: 4, md: 10}}
            letterSpacing="wide"
            justifyContent={ALIGNMENT_JUSTIFY[resolvedAlignment]}
            {...heightStyle}
            {...colorStyle}
        >
            <Text textAlign={resolvedAlignment} margin={0}>
                {message}
                {linkUrl && linkText && (
                    <>
                        {' '}
                        <LinkWrapper
                            {...linkProps}
                            textDecoration="underline"
                            fontWeight="medium"
                            whiteSpace="nowrap"
                            color="inherit"
                        >
                            {linkText}
                        </LinkWrapper>
                    </>
                )}
            </Text>
        </Box>
    )
}

AnnouncementBanner.propTypes = {
    message: PropTypes.string,
    linkUrl: PropTypes.string,
    linkText: PropTypes.string,
    colorScheme: PropTypes.string,
    height: PropTypes.string,
    alignment: PropTypes.string
}

AnnouncementBanner.displayName = 'AnnouncementBanner'

/**
 * Suspense fallback for the Announcement Banner. Mirrors the default md/center/primary
 * height so switching from fallback to real content does not shift layout.
 *
 * @returns {React.ReactElement} - Skeleton placeholder.
 */
export function AnnouncementBannerFallback() {
    return (
        <Box
            aria-hidden="true"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={{base: 4, md: 10}}
            py={3}
            bg="blue.600"
        >
            <Skeleton height="16px" width="192px" />
        </Box>
    )
}

AnnouncementBannerFallback.displayName = 'AnnouncementBannerFallback'

export default AnnouncementBanner

// The V2 registry reads a module's named `fallback` export to render during the
// client Suspense boundary while the component chunk loads.
export {AnnouncementBannerFallback as fallback}
```

**Key points:**

- **The prop names are the descriptor's attribute ids.** `message`, `linkUrl`, `linkText`, `colorScheme`, `height`, `alignment` map 1:1 to the `attribute_definitions` you author in Step 5. Keep them in sync.
- **`if (!message) return null`.** A banner with no message renders nothing — a required attribute, defensively enforced in the component too.
- **Token-based color/height/alignment, normalized.** `normalize()` clamps any unexpected value back to a safe default (`md`/`center`/`primary`) so a bad authored value can't break layout or contrast.
- **Absolute vs. relative links.** `isAbsoluteURL` (from `page-designer/utils`) picks between the Chakra `Link` (external `href`) and the app router `Link` (internal `to`), so internal links stay client-side.
- **The `fallback` named export is the Suspense placeholder.** The V2 registry renders a module's `fallback` export while the component's code-split chunk loads. Exporting `AnnouncementBannerFallback as fallback` wires that up; the skeleton mirrors the default banner height to avoid layout shift.

Add a content barrel so the component map can import from a single path:

```js
// file: app/page-designer/content/index.js

/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export * from './announcement-banner'
```

---

## Step 3 — Wire the embedded subtree into the app shell

This is the heart of ECB. In your **full storefront shell** (`StorefrontApp`), fetch the singleton `header` component with `useComponent` and render its `announcement` region above the storefront header, wrapped in `EmbeddedSubtreeProvider`.

```jsx
// file: app/components/_app/index.jsx  (excerpts)

// Add useComponent to the existing commerce-sdk-react import
import {
    useAccessToken,
    useCategory,
    useComponent,
    useShopperBasketsMutation,
    useUsid
} from '@salesforce/commerce-sdk-react'

// Add Region to the existing page-designer import
import {PageDesignerProvider, Region} from '@salesforce/commerce-sdk-react/page-designer'
import PageDesignerInit from '@salesforce/retail-react-app/app/components/page-designer-init'
// New for ECB: the embedded-subtree provider from storefront-next-runtime 1.2.0
import {EmbeddedSubtreeProvider} from '@salesforce/storefront-next-runtime/design/react/core'
```

Inside `StorefrontApp`, fetch the singleton component alongside the other top-level data hooks:

```jsx
// file: app/components/_app/index.jsx  (inside StorefrontApp)

// Embedded content-block header: a singleton Page Designer component (instance id
// `header`) that exposes an `announcement` region rendered above the storefront header.
// `useComponent` is Page-Designer-mode aware (handles mode/pdToken internally).
const {data: embeddedHeader} = useComponent({parameters: {componentId: 'header'}})
```

Then render the region above `<AboveHeader />`, gated on the component existing:

```jsx
// file: app/components/_app/index.jsx  (inside the header wrapper, non-checkout branch)

<Box {...styles.headerWrapper}>
    {!isCheckout ? (
        <>
            {embeddedHeader && (
                <EmbeddedSubtreeProvider embedded>
                    <Region component={embeddedHeader} regionId="announcement" />
                </EmbeddedSubtreeProvider>
            )}
            <AboveHeader />
            <Header
                onMenuClick={onOpen}
                /* …existing props… */
            />
        </>
    ) : (
        /* …checkout header… */
    )}
</Box>
```

**Key points:**

- **`useComponent({parameters: {componentId: 'header'}})` fetches the singleton.** The `componentId` is a fixed, well-known id (`'header'`) — it matches the descriptor's `component_id` in Step 5. Unlike CBE, nothing supplies this id per-request; the storefront always asks for the same embedded component.
- **`useComponent` is already Page-Designer-mode aware.** It reads `mode`/`pdToken` from the provider config (the CBE plumbing you already have) and switches to `rawResponse: true` in design/preview mode. You do not add any mode handling here.
- **Gate on `embeddedHeader`.** Until the component resolves — or if no embedded header is authored — render nothing. No banner, no layout shift beyond the component's own fallback.
- **`EmbeddedSubtreeProvider embedded` marks this subtree as embedded chrome.** This is the new runtime piece. It tells the design runtime that the wrapped `<Region>` is an embedded content block living in your layout (not a Page Designer page), so CBE can target and edit it in place. The `embedded` boolean prop turns that behavior on.
- **It renders the same `announcement` region as the `Header` layout component (Step 1).** The app-shell path (`<Region component={embeddedHeader} regionId="announcement" />`) is what shows on the live storefront; the `Header` layout component is the registry-resolved rendering used when the component is reached through the V2 pipeline (e.g. in CBE). Both render the identical region.
- **Not on checkout.** The embedded header renders only in the non-checkout branch, matching where the storefront normally shows its header.

---

## Step 4 — Register the new components

Add the two new components to the **eager type map** and the **lazy importer registry** — the same two mechanisms the CBE guide established. ECB adds `Header` and `AnnouncementBanner`.

```js
// file: app/page-designer/component-map.js

/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ImageWithText, ImageTile} from '@salesforce/retail-react-app/app/page-designer/assets'
import {
    Carousel,
    Header,
    MobileGrid1r1c,
    MobileGrid2r1c,
    MobileGrid2r2c,
    MobileGrid2r3c,
    MobileGrid3r1c,
    MobileGrid3r2c
} from '@salesforce/retail-react-app/app/page-designer/layouts'
import {AnnouncementBanner} from '@salesforce/retail-react-app/app/page-designer/content'

// Map Page Designer component type IDs to React components
export const PAGEDESIGNER_TO_COMPONENT = {
    'commerce_assets.imageAndText': ImageWithText,
    'commerce_assets.imageTile': ImageTile,
    'commerce_layouts.carousel': Carousel,
    'commerce_layouts.header': Header,
    'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c,
    'commerce_layouts.mobileGrid2r1c': MobileGrid2r1c,
    'commerce_layouts.mobileGrid2r2c': MobileGrid2r2c,
    'commerce_layouts.mobileGrid2r3c': MobileGrid2r3c,
    'commerce_layouts.mobileGrid3r1c': MobileGrid3r1c,
    'commerce_layouts.mobileGrid3r2c': MobileGrid3r2c,
    'commerce_assets.announcementBanner': AnnouncementBanner
}
```

Export `Header` from the layouts barrel so the map import above resolves:

```js
// file: app/page-designer/layouts/index.js

export * from './carousel'
export * from './header'
export * from './mobileGrid1r1c'
export * from './mobileGrid2r1c'
export * from './mobileGrid2r2c'
export * from './mobileGrid2r3c'
export * from './mobileGrid3r1c'
export * from './mobileGrid3r2c'
```

Add the two lazy importers to the registry:

```js
// file: app/page-designer/registry.js  (added lines)

export function initializeRegistry() {
    // …existing importers (imageAndText, imageTile, carousel, mobileGrid*)…

    registry.registerImporter('commerce_layouts.carousel', () => import('./layouts/carousel'))
    registry.registerImporter('commerce_layouts.header', () => import('./layouts/header'))

    registry.registerImporter('commerce_assets.announcementBanner', () =>
        import('./content/announcement-banner')
    )
}
```

**Critical invariant (same as CBE):** each `typeId` is `{group}.{componentId}`, which must equal `{descriptor-folder}.{descriptor-filename}`. For ECB that means:

| typeId | Map key | Registry importer key | Descriptor path |
|---|---|---|---|
| `commerce_layouts.header` | `Header` | `commerce_layouts.header` | `commerce_layouts/header.json` |
| `commerce_assets.announcementBanner` | `AnnouncementBanner` | `commerce_assets.announcementBanner` | `commerce_assets/announcementBanner.json` |

All three columns must match byte-for-byte, or the component silently fails to resolve.

---

## Step 5 — Author and upload the descriptors (cartridge)

As with CBE, the React side only teaches the storefront how to *render*. The Commerce Cloud side needs descriptors for both new components. The header descriptor is the one that uses the **ECB-specific fields**.

### The embedded header descriptor

```json
// file: cartridges/app_pwa_base/cartridge/experience/components/commerce_layouts/header.json

{
    "name": "Header",
    "description": "Embedded header component that exposes an announcement region above the storefront header.",
    "group": "commerce_layouts",
    "arch_type": "headless",
    "embedded": true,
    "component_id": "header",
    "region_definitions": [
        {
            "id": "announcement",
            "name": "Announcement",
            "description": "Displayed above the header."
        }
    ],
    "attribute_definition_groups": [
        {
            "id": "header",
            "name": "Header",
            "description": "Global site header with an announcement region.",
            "attribute_definitions": []
        }
    ]
}
```

**Key points — these two fields are what make it ECB:**

- **`"embedded": true`.** This marks the component as an *embedded content block* — a singleton that lives in your storefront chrome, not a component dropped into a Page Designer page. It is the flag CBE and the Content Workspace use to treat it as embedded.
- **`"component_id": "header"`.** This fixes the instance id so the storefront can fetch it by a known id — exactly the `componentId` your app shell passes to `useComponent({parameters: {componentId: 'header'}})` in Step 3. Without an explicit `component_id`, there is no stable id to fetch.
- **`region_definitions` declares the `announcement` region.** The region `id` (`announcement`) is what both the app-shell `<Region regionId="announcement">` and the `Header` layout component render. It's where the merchandiser drops the banner.
- **No editable attributes on the header itself.** `attribute_definitions` is empty — the header is a structural container; the editable content lives in the banner it hosts.

> **`embedded` / `component_id` are ECB-only.** A standard CBE component (leaf or layout, like the carousel) does **not** use these. If you're adding a normal editable component, follow the CBE guide's descriptor shape instead.

### The announcement banner descriptor

The banner is a normal leaf content block — no `embedded` flag. Its `attribute_definitions` are the props the React component reads (Step 2).

```json
// file: cartridges/app_pwa_base/cartridge/experience/components/commerce_assets/announcementBanner.json

{
    "name": "Announcement Banner",
    "description": "A banner for announcements, promotions, and alerts.",
    "group": "commerce_assets",
    "arch_type": "headless",
    "region_definitions": [],
    "attribute_definition_groups": [
        {
            "id": "announcementBanner",
            "name": "Announcement Banner",
            "description": "A banner for announcements, promotions, and alerts.",
            "attribute_definitions": [
                {
                    "id": "message",
                    "name": "Message",
                    "type": "string",
                    "required": true,
                    "description": "The announcement text."
                },
                {
                    "id": "linkUrl",
                    "name": "Link URL",
                    "type": "url",
                    "required": false,
                    "description": "Optional link target. Shown only when Link Text is also set."
                },
                {
                    "id": "linkText",
                    "name": "Link Text",
                    "type": "string",
                    "required": false,
                    "description": "Optional link label. Shown only when Link URL is also set."
                },
                {
                    "id": "colorScheme",
                    "name": "Color Scheme",
                    "type": "enum",
                    "required": false,
                    "values": ["primary", "secondary", "destructive"],
                    "default_value": "primary",
                    "description": "Token-based color treatment for guaranteed contrast."
                },
                {
                    "id": "height",
                    "name": "Height",
                    "type": "enum",
                    "required": false,
                    "values": ["sm", "md", "lg"],
                    "default_value": "md",
                    "description": "Vertical density of the banner."
                },
                {
                    "id": "alignment",
                    "name": "Alignment",
                    "type": "enum",
                    "required": false,
                    "values": ["left", "center", "right"],
                    "default_value": "center",
                    "description": "Horizontal alignment of the message."
                }
            ]
        }
    ]
}
```

**Key point:** the six attribute `id`s (`message`, `linkUrl`, `linkText`, `colorScheme`, `height`, `alignment`) are exactly the props the `AnnouncementBanner` component destructures. The `enum` `values` and `default_value`s match the component's `normalize()` allow-lists and fallbacks — keep the two definitions in lockstep.

### Deploy and register

Deploy the cartridge and add it to your site's cartridge path exactly as in the CBE guide (WebDAV / B2C Commerce Studio / CI, then *Administration → Sites → Manage Sites → {site} → Settings*). Once the descriptors are live:

1. In the **Content Workspace**, the embedded **Header** appears as a singleton; author its `announcement` region.
2. Drop an **Announcement Banner** block into that region and fill in its attributes.
3. Reload any storefront page — the banner renders above the header. Open it in the focused visual canvas to edit it in CBE.

---

## Step 6 — (Optional) Mock data for tests and Storybook

If you test the components in isolation, this mock mirrors the shape `useComponent` returns for the embedded header, including a nested announcement banner.

```js
// file: app/mocks/page-designer.js  (excerpt — ECB additions)

export const mockAnnouncementBanner = {
    message: 'Free standard shipping on orders over $50',
    linkUrl: '/sale',
    linkText: 'Shop the sale',
    colorScheme: 'primary',
    height: 'md',
    alignment: 'center'
}

export const mockEmbeddedHeader = {
    id: 'header',
    typeId: 'commerce_layouts.header',
    regions: [
        {
            id: 'announcement',
            components: [
                {
                    id: 'announcement-banner-1',
                    typeId: 'commerce_assets.announcementBanner',
                    data: mockAnnouncementBanner
                }
            ]
        }
    ]
}
```

**Key point:** `mockEmbeddedHeader` has `id: 'header'` and `typeId: 'commerce_layouts.header'`, and its single `announcement` region holds one `commerce_assets.announcementBanner` component whose `data` is the banner attributes. This is the exact shape `<Region component={embeddedHeader} regionId="announcement">` expects — use it to render the subtree without a live `getComponent` call.

---

## How it works in Page Designer + CBE

- **On the live storefront:** every page runs `StorefrontApp`, which fetches the `header` singleton and renders its `announcement` region inline above the storefront header. A published banner shows to shoppers on every non-checkout page.
- **In CBE (focused editing):** because the embedded subtree is wrapped in `EmbeddedSubtreeProvider embedded` and rendered through the same `PageDesignerProvider` you set up for CBE, Commerce Cloud can open the embedded header — or the banner inside it — in the focused visual canvas and edit it in place. The `mode`/`pdToken` params flow through the provider exactly as in CBE, and `useComponent` switches to raw-response fetching automatically.
- **Preview route reuse:** the CBE preview route (`/preview/component`) resolves `commerce_layouts.header` and `commerce_assets.announcementBanner` via the registry entries you added in Step 4, so previewing either component standalone works with no extra wiring.

The single rule that ties it together: **every embedded component needs all three of** — the React component + registration (Steps 1–4), the app-shell fetch/render (Step 3), and the descriptor with `"embedded": true` + `component_id` (Step 5).

---

## See Also

- **Integrate the Content Block Editor (CBE) with PWA Kit** — the required foundation for this guide (preview route, synthetic-page helper, registry/type-map, `PageDesignerProvider` shell, SSR `default`-locale redirect). Complete it first.
- **Integrate Page Designer with PWA Kit** — the baseline both CBE and ECB build on (`registry`, the `<Page>`/`<Region>` render pipeline, layout and leaf components).
