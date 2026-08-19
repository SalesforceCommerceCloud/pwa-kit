# Integrate the Content Block Editor with PWA Kit

The **Content Block Editor (CBE)** in Commerce Cloud 26.8 is a focused visual editor that opens a *single* Page Designer component in an iframe embedded in your live PWA Kit (Managed Runtime) storefront. A content manager clicks **Edit in focused visual canvas** in the Content Workspace, and Commerce Cloud loads your storefront at a dedicated preview route — rendering that one persisted component **chrome-free** (no header, footer, menus, or shopper state) so it can be edited in isolation.

This differs from the full [Page Designer PWA integration](#see-also), which previews a *complete page* made of many components. CBE previews **one component**, wrapped just enough to run through the exact same rendering pipeline.

This guide walks you through adding CBE support to a PWA Kit project (based on the `retail-react-app` template) that already has a working Page Designer integration.

CBE integration is a **paired effort across two systems**: the **PWA Kit (React) side** — the route, preview page, registry, and provider wiring below — and the **Commerce Cloud (cartridge) side** — the component descriptors you author and upload to your SFCC instance (**Step 4b**). Neither half works alone: without the React registration a component can't render; without the descriptor CBE has nothing to open. Each component you want editable in CBE needs *both*.

> **This guide documents the working implementation, not the earlier draft.** An earlier internal draft ("PWA Kit Component Preview Route for Commerce Cloud 26.8") described a more manual approach that has since been superseded. Where it diverges from what actually ships, this guide calls it out under **Correcting the earlier draft**.

---

## Prerequisites

- A working **Page Designer + PWA Kit** integration: the component `registry`, the `<Page>`/`<Region>` render pipeline, and your leaf/layout components already render Page Designer *pages*. This guide builds directly on that foundation.
- **`@salesforce/commerce-sdk-react`** `5.4.0-dev` or later — the version that ships the `useComponent` hook (see the note under **Step 2**). Import path: `@salesforce/commerce-sdk-react`.
- **`@salesforce/storefront-next-runtime@1.2.0`** or later — provides `PageDesignerProvider`, `usePageDesignerMode`, and `useGlobalAnchorBlock`. (These are re-exported through `@salesforce/commerce-sdk-react/page-designer`; see below.)
- **`@salesforce/pwa-kit-runtime`** and **`@salesforce/pwa-kit-react-sdk`** `3.20.0-dev` or later.
- **Node 24** for tooling and local dev.
- A **SLAS client that includes the `sfcc.shopper-experience` scope** — the Shopper Experience API (`getComponent`) requires it. This is configured on the SLAS client in Account Manager / Business Manager, not in PWA Kit config files.

**Import boundary — read this first.** Two different entry points are involved and it is easy to get them wrong:

- `useComponent` is imported from the **package root**: `import {useComponent} from '@salesforce/commerce-sdk-react'`.
- `Page`, `Region`, `registry`, `PageDesignerProvider`, `usePageDesignerMode`, and `useGlobalAnchorBlock` come from the **subpath**: `import {Page} from '@salesforce/commerce-sdk-react/page-designer'`.

The `/page-designer` barrel does **not** re-export the Shopper Experience hooks — importing `useComponent` from it will fail.

---

## Architecture Overview

```
Content Workspace (CC 26.8)
        │  "Edit in focused visual canvas"
        ▼
Focused editor opens an iframe pointed at your storefront:
   /{site}/default/preview/component?mode=EDIT&componentId={id}&pdToken={token}&stamp={n}
        │
        ▼
PWA Kit SSR (ssr.js)
   • `/{site}/default/...` → 302 → `/{site}/{defaultLocale}/preview/component?…`
     (SFCC's `default` pseudo-locale → the site's real default locale)
        │
        ▼
_app-config: resolvePageDesignerParamsFromUrl(url) → {mode, pdToken, pageId}
   • stored on locals.pageDesignerParams
   • passed to <CommerceApiProvider pageDesignerParams={…}>
        │
        ▼
_app selects the chrome-free ComponentPreviewApp shell (route matches /preview/component)
        │
        ▼
pages/component-preview: useComponent({parameters:{componentId}})
   • in Page Designer mode the hook fetches with rawResponse:true
        │
        ▼
injectIntoPreviewRegion(component) → synthetic one-region page
        │
        ▼
<Page page={…} components={PAGEDESIGNER_TO_COMPONENT} />   ← the SAME pipeline the home page uses
        │
        ▼
Single component rendered chrome-free inside the iframe
```

**Key point:** CBE support reuses your existing render pipeline. There is no forked renderer — a single fetched component is wrapped in a minimal synthetic page so `<Page>`/`<Region>` can render it standalone.

---

## Step 1 — Add the preview route

Register a `/preview/component` route. Add the `loadable` import alongside the other page imports, then add the route entry.

```jsx
// file: app/routes.jsx

const ComponentPreview = loadable(() => import('./pages/component-preview'), {fallback})

export const routes = [
    // …existing routes…
    {
        path: '/preview/component',
        component: ComponentPreview
    }
]
```

**Key points:**

- **No `exact: true`.** Locale prefixing (`/{site}/{locale}/preview/component`) is handled by `configureRoutes(..., {fuzzyPathMatching: true})`, which is already applied at the bottom of `routes.jsx`:

  ```jsx
  const allRoutes = configureRoutes([...routes, ...dynamicRoutes], config, {
      ignoredRoutes: ['/callback'],
      fuzzyPathMatching: true
  })
  ```

---

## Step 2 — Implement the preview page

This route renders a single component chrome-free. Create the file below verbatim.

```jsx
// file: app/pages/component-preview/index.jsx

import React from 'react'
import {useLocation} from 'react-router-dom'
import {useComponent} from '@salesforce/commerce-sdk-react'
import {Page} from '@salesforce/commerce-sdk-react/page-designer'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {PAGEDESIGNER_TO_COMPONENT} from '@salesforce/retail-react-app/app/page-designer/component-map'
import {injectIntoPreviewRegion} from '@salesforce/retail-react-app/app/page-designer/preview-page'

const ComponentPreview = () => {
    const {search} = useLocation()
    const searchParams = new URLSearchParams(search)
    const componentId = searchParams.get('componentId')
    // Read mode straight from the URL search — SSR-safe (no window dependency).
    // The runtime's isDesignModeActive()/isPreviewModeActive() no-arg forms fall
    // back to window.location and are unsafe during SSR, so we don't use them.
    const mode = searchParams.get('mode')
    const inDesignOrPreview = mode === 'EDIT' || mode === 'PREVIEW'

    const {
        data: component,
        isLoading,
        error
    } = useComponent(
        {parameters: {componentId}},
        {enabled: Boolean(inDesignOrPreview && componentId)}
    )

    if (!inDesignOrPreview || !componentId) {
        return null
    }

    return (
        <Box data-testid="component-preview-page" layerStyle="page">
            <Seo title="Component Preview" noIndex />
            {isLoading && (
                <Box textAlign="center" py={8}>
                    Loading...
                </Box>
            )}
            {error && (
                <Box textAlign="center" py={8} color="red.500">
                    Error loading component.
                </Box>
            )}
            {component && !error && (
                <Page
                    page={injectIntoPreviewRegion(component)}
                    components={PAGEDESIGNER_TO_COMPONENT}
                />
            )}
        </Box>
    )
}

ComponentPreview.getTemplateName = () => 'component-preview'

export default ComponentPreview
```

**Key points:**

- **`mode` and `componentId` are read from `useLocation().search`, not from the runtime helpers.** The runtime's no-arg `isDesignModeActive()` / `isPreviewModeActive()` fall back to `window.location`, which is undefined during SSR. Reading `URLSearchParams(search)` is SSR-safe.
- **Gate on `mode`.** The page renders only when `mode === 'EDIT'` or `mode === 'PREVIEW'`; otherwise it returns `null`. This keeps the route from rendering anything for a plain visitor.
- **`useComponent` fetches by `componentId`.** The `enabled` flag ties the query to being in design/preview mode with a real `componentId`.
- **Chrome-free + `noIndex`.** `<Seo … noIndex />` prevents indexing of this internal authoring surface.
- **`getTemplateName`** is used by PWA Kit's SSR to identify the template.

> **`useComponent` exists — this is the main correction to the earlier draft.** The draft claimed `commerce-sdk-react@5.4.0-dev` had no `useComponent` hook and worked around it by calling the raw `shopperExperience.getComponent` client with `useAccessToken().getTokenWhenReady()`. That is not the case: `5.4.0-dev` ships `useComponent` (`packages/commerce-sdk-react/src/hooks/ShopperExperience/query.ts`), and it is Page-Designer-mode aware. **Use the hook.** Do not hand-roll the client call.

---

## Step 3 — Add the synthetic preview-page helper

`<Page>` renders a Page Designer *page* (an object with `regions`, each containing `components`). To render a single fetched component through that same pipeline, wrap it in a minimal one-region page.

```js
// file: app/page-designer/preview-page.js

/**
 * The id of the synthetic region that hosts the single previewed component.
 * Must stay stable; the mini-PD canvas targets this region.
 */
export const PREVIEW_REGION_ID = 'preview'

/** The id of the synthetic page wrapping the previewed component. */
export const PREVIEW_PAGE_ID = '__pwakit_preview__'

/**
 * Wrap a single fetched Page Designer component in a synthetic one-region page
 * so the existing page-mode <Page>/<Region> pipeline can render it standalone,
 * with no changes to the render pipeline.
 *
 * @param {object} component - A Shopper Experience Component (from useComponent).
 * @returns {object} A minimal Page-shaped object hosting the component.
 */
export const injectIntoPreviewRegion = (component) => ({
    id: PREVIEW_PAGE_ID,
    regions: [{id: PREVIEW_REGION_ID, components: [component]}]
})
```

**Key point:** This is the whole trick that avoids a forked renderer. No changes to `<Page>` or `<Region>` are required.

> **Correcting the earlier draft (render path).** The draft rendered the preview with `addDesignDefaults(...)` followed by `<Region page={page} regionId="preview">`. The working implementation instead synthesizes a page with `injectIntoPreviewRegion` and renders it with `<Page page={…} components={PAGEDESIGNER_TO_COMPONENT} />` — the same call the home page makes. Prefer this; it keeps a single render path for both full pages and single-component previews.

---

## Step 4 — Prepare the component registry and type map

The preview reuses the same two registration mechanisms your Page Designer integration already uses:

1. **`PAGEDESIGNER_TO_COMPONENT`** — an eager map of `typeId → React component`, passed to `<Page components={…}>`.
2. **`initializeRegistry()`** — lazy importers registered on the shared `registry`.

```js
// file: app/page-designer/component-map.js

import {ImageWithText, ImageTile} from '@salesforce/retail-react-app/app/page-designer/assets'
import {
    Carousel,
    MobileGrid1r1c,
    MobileGrid2r1c,
    MobileGrid2r2c,
    MobileGrid2r3c,
    MobileGrid3r1c,
    MobileGrid3r2c
} from '@salesforce/retail-react-app/app/page-designer/layouts'

// Map Page Designer component type IDs to React components
export const PAGEDESIGNER_TO_COMPONENT = {
    'commerce_assets.imageAndText': ImageWithText,
    'commerce_assets.imageTile': ImageTile,
    'commerce_layouts.carousel': Carousel,
    'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c,
    'commerce_layouts.mobileGrid2r1c': MobileGrid2r1c,
    'commerce_layouts.mobileGrid2r2c': MobileGrid2r2c,
    'commerce_layouts.mobileGrid2r3c': MobileGrid2r3c,
    'commerce_layouts.mobileGrid3r1c': MobileGrid3r1c,
    'commerce_layouts.mobileGrid3r2c': MobileGrid3r2c
}
```

```js
// file: app/page-designer/registry.js  (excerpt)

import {registry} from '@salesforce/commerce-sdk-react/page-designer'

export function initializeRegistry() {
    registry.registerImporter('commerce_assets.imageAndText', () =>
        import('./assets/image-with-text')
    )
    registry.registerImporter('commerce_assets.imageTile', () => import('./assets/image-tile'))
    registry.registerImporter('commerce_layouts.carousel', () => import('./layouts/carousel'))
    // …the remaining mobileGrid* importers…
}
```

**Critical invariant:** a Page Designer component's `typeId` is `{group}.{componentId}`, which must equal `<descriptor-folder-name>.<descriptor-filename>`. The **map key**, the **importer key**, and the **descriptor** must match byte-for-byte. A mismatch renders nothing (or an "unregistered component" fallback) with no obvious error. The descriptor side of this match is authored in a cartridge — see **Step 4b**.

For a component to appear in CBE, it must be registered in **both** places: the eager map (so `<Page components>` can render it) and the lazy registry (so it can be code-split and resolved by `typeId`).

---

## Step 4b — Author and upload the component descriptors (cartridge)

The steps so far are the **PWA Kit (React) half** — they teach your storefront how to *render* a component. But CBE has nothing to open until the **Commerce Cloud half** exists: a **Page Designer component descriptor** for each component, defined in a cartridge and uploaded to your SFCC instance. These are files **you author and deploy yourself** — they are not part of the PWA Kit template and cannot be, because they live on the SFCC side and describe your specific components' editable attributes.

Without a matching descriptor, `useComponent` has no component to fetch, and the Content Workspace has nothing to list in the focused editor.

### Cartridge layout

Descriptors live in a standard Page Designer cartridge under `experience/components/{group}/`, where the folder name is the component's **group** and the file name (minus `.json`) is the **component id**:

```
cartridges/
└── app_pwa_base/
    └── cartridge/
        ├── .project
        ├── app_pwa_base.properties
        └── experience/
            ├── components/
            │   ├── commerce_assets/
            │   │   ├── imageTile.json          → typeId commerce_assets.imageTile
            │   │   └── imageAndText.json        → typeId commerce_assets.imageAndText
            │   └── commerce_layouts/
            │       └── carousel.json            → typeId commerce_layouts.carousel
            └── pages/
                └── homepage.json
```

**This is the other half of the typeId invariant from Step 4.** The React map key (`'commerce_assets.imageTile'`), the registry importer key, and `{folder}.{filename}` here must match **byte-for-byte**. A mismatch means CBE opens a component your storefront can't resolve — it renders nothing, with no obvious error.

### A leaf-component descriptor

Each descriptor names the component and declares its editable attributes. `arch_type: "headless"` marks it for a headless (PWA Kit) storefront; `region_definitions` is empty for a leaf component.

```json
// file: cartridges/app_pwa_base/cartridge/experience/components/commerce_assets/imageAndText.json

{
    "name": "Image With Text",
    "description": "An image with an optional text overlay, caption, and link.",
    "group": "commerce_assets",
    "arch_type": "headless",
    "region_definitions": [],
    "attribute_definition_groups": [
        {
            "id": "imageAndText",
            "name": "Image With Text",
            "description": "An image with an optional text overlay, caption, and link.",
            "attribute_definitions": [
                {
                    "id": "image",
                    "name": "Image",
                    "type": "image",
                    "required": true,
                    "description": "The image to display."
                },
                {
                    "id": "heading",
                    "name": "Heading Overlay",
                    "type": "markup",
                    "required": false,
                    "description": "Text overlay displayed centered on the image."
                },
                {
                    "id": "ITCLink",
                    "name": "Link URL",
                    "type": "url",
                    "required": false,
                    "description": "Optional URL that wraps the image in a link."
                }
            ]
        }
    ]
}
```

**Key point:** the attribute `id`s you declare here (`image`, `heading`, `ITCLink`, …) are exactly the keys your React component reads from `component.data` (or its props). Keep them in sync with the component you registered in Step 4 — the descriptor defines the editing form, the React component consumes the values.

### A component with a region

If a component nests other components (a layout such as a carousel or grid), declare a `region_definitions` entry. The region `id` is what your React component passes to `<Region regionId="…">`, and it is where a content manager drops child components in the editor. The carousel is the example — its `items` region hosts the slides:

```json
// file: cartridges/app_pwa_base/cartridge/experience/components/commerce_layouts/carousel.json

{
    "name": "Carousel",
    "description": "Displays child components in a horizontally scrollable carousel with optional heading, navigation controls, and scroll indicators.",
    "group": "commerce_layouts",
    "arch_type": "headless",
    "region_definitions": [
        {
            "id": "items",
            "name": "Carousel Items",
            "description": "Components to display as carousel slides."
        }
    ],
    "attribute_definition_groups": [
        {
            "id": "carousel",
            "name": "Carousel",
            "description": "Displays child components in a horizontally scrollable carousel with optional heading, navigation controls, and scroll indicators.",
            "attribute_definitions": [
                {
                    "id": "textHeadline",
                    "name": "Heading",
                    "type": "string",
                    "required": false,
                    "description": "Optional heading displayed above the carousel."
                },
                {
                    "id": "xsCarouselSlidesToDisplay",
                    "name": "Slides Visible (Mobile)",
                    "type": "enum",
                    "required": false,
                    "values": ["1", "2", "3", "4", "5", "6"],
                    "default_value": "1",
                    "description": "Number of slides visible at once on mobile (xs) screens."
                }
            ]
        }
    ]
}
```

> **`embedded` components are an ECB concept, not a CBE one.** If you have seen descriptors with `"embedded": true` and an explicit `component_id` (for example an embedded header that injects an announcement region into an existing storefront region), those belong to the **Embedded Content Blocks** feature, which is documented separately. A standard CBE component — leaf or layout — does not need them.

### Cartridge scaffolding

A deployable cartridge needs two supporting files at its root:

```xml
<!-- file: cartridges/app_pwa_base/cartridge/.project -->
<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
	<name>app_pwa_base</name>
	<comment></comment>
	<projects></projects>
	<buildSpec>
		<buildCommand>
			<name>com.demandware.studio.core.beehiveElementBuilder</name>
			<arguments></arguments>
		</buildCommand>
	</buildSpec>
	<natures>
		<nature>com.demandware.studio.core.beehiveNature</nature>
	</natures>
</projectDescription>
```

```properties
# file: cartridges/app_pwa_base/cartridge/app_pwa_base.properties
demandware.cartridges.app_pwa_base.multipleLanguageStorefront=true
demandware.cartridges.app_pwa_base.id=app_pwa_base
demandware.cartridges.app_pwa_base.version=0.0.1
```

### Deploy and register

1. **Upload the cartridge** to your SFCC instance the way you deploy any cartridge (WebDAV via `sfcc-ci`/`dw.json`, B2C Commerce Studio, or your CI pipeline).
2. **Add the cartridge to your site's cartridge path** in Business Manager (*Administration → Sites → Manage Sites → {site} → Settings*) so the platform picks up the descriptors.
3. In the **Content Workspace**, the components now appear and can be authored; each authored instance is what CBE opens in the focused editor and what `useComponent` fetches by `componentId`.

> **This step is yours to own, per component.** Every component you want editable in CBE needs a descriptor here *and* the two React registrations from Step 4. Adding a component is always a paired change: descriptor (SFCC) + map/registry entry (PWA Kit).

---

## Step 5 — Verify Page Designer params flow through the provider

> **This is baseline Page Designer plumbing you most likely already have — verify it, don't recreate it.** The `resolvePageDesignerParamsFromUrl` helper and the `CommerceApiProvider` wiring below ship as part of the baseline Page Designer + PWA Kit integration named in **Prerequisites** (introduced by the `feat/pd-support` work already on `develop`). CBE reuses it unchanged. Confirm the code below is present in your project; only add it if your baseline predates it. The steps that *are* new for CBE are the preview page (Step 2), the synthetic-page helper (Step 3), the preview shell (Step 5b), and the SSR redirect (Step 6).

Commerce Cloud appends Page Designer parameters to the iframe URL. They are extracted server-side and passed into `CommerceApiProvider` so the SDK hooks can read them SSR-safely.

```js
// file: app/utils/site-utils.js  (excerpt)

/**
 * Extract Page Designer parameters from a given URL.
 * @param {string} url - The URL to extract parameters from
 * @returns {{mode?: string, pdToken?: string, pageId?: string}} - Page Designer parameters
 */
export const resolvePageDesignerParamsFromUrl = (url) => {
    if (!url) {
        return {}
    }
    const {search} = getPathnameAndSearch(url)
    const searchParams = new URLSearchParams(search)

    const params = {}
    const mode = searchParams.get('mode')
    const pdToken = searchParams.get('pdToken')
    const pageId = searchParams.get('pageId')

    if (mode) {
        params.mode = mode
    }
    if (pdToken) {
        params.pdToken = pdToken
    }
    if (pageId) {
        params.pageId = pageId
    }

    return params
}
```

```jsx
// file: app/components/_app-config/index.jsx  (excerpt)

import {
    resolveSiteFromUrl,
    resolveLocaleFromUrl,
    resolvePageDesignerParamsFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'

const AppConfig = ({children, locals = {}}) => {
    // …
    const pageDesignerParams = locals.pageDesignerParams || {}

    return (
        <CommerceApiProvider
            // …other props…
            pageDesignerParams={pageDesignerParams}
        >
            {/* …providers… */}
        </CommerceApiProvider>
    )
}

AppConfig.restore = (locals = {}) => {
    const path =
        typeof window === 'undefined'
            ? locals.originalUrl
            : `${window.location.pathname}${window.location.search}`
    // …
    const pageDesignerParams = resolvePageDesignerParamsFromUrl(path)
    // …
    locals.pageDesignerParams = pageDesignerParams
}
```

**How the hook side consumes this:** inside `commerce-sdk-react`, `useComponent` calls `usePageDesignerParams()`, which reads `useConfig().pageDesignerParams` — **not** the URL directly. That is the SSR-safe boundary: the URL is parsed once, server-side, and the resulting params flow through the provider config. The hook then computes `isPageDesignerMode = Boolean(mode || pdToken)`. When true, it fetches `getComponent` with `rawResponse: true` and calls `.json()` itself, preserving response fields (like design metadata) that the runtime otherwise trims for performance.

**Split responsibility — do not conflate these params:**

| Param | Extracted by `resolvePageDesignerParamsFromUrl`? | Where it's consumed |
|---|---|---|
| `mode` | Yes | Provider config → `useComponent` (PD-mode switch); also read in the preview page and shell |
| `pdToken` | Yes | Provider config → `useComponent` (sent as a request param) |
| `pageId` | Yes | Provider config → `usePage` (full-page preview; not used by single-component preview) |
| `componentId` | **No** | Read at the component level in the preview page: `useComponent({parameters:{componentId}})` |
| `stamp` | **No** | Cache-buster only; preserved through the SSR redirect (Step 6) |

Do **not** claim the provider carries `componentId`. It does not — the preview page reads it straight from the URL.

---

## Step 5b — Add the preview-specific app shell

The preview must not render storefront chrome or fire shopper-state side effects. The app selects a shell by route: the preview route gets a minimal `ComponentPreviewApp`; everything else gets the full `StorefrontApp`.

```jsx
// file: app/components/_app/index.jsx  (excerpts)

import {PageDesignerProvider, Region} from '@salesforce/commerce-sdk-react/page-designer'
import PageDesignerInit from '@salesforce/retail-react-app/app/components/page-designer-init'
import {initializeRegistry} from '@salesforce/retail-react-app/app/page-designer/registry'

// Initialize registry synchronously at module load time so components are available during SSR
initializeRegistry()

/**
 * Path (without the `/:site/:locale` prefix) served chrome-free by the Page Designer
 * component-preview iframe.
 */
const COMPONENT_PREVIEW_PATH_RE = /\/preview\/component$/

const ComponentPreviewApp = (props) => {
    const {children} = props
    const {getTokenWhenReady} = useAccessToken()
    const {usid} = useUsid()
    // …i18n / currency setup only — no basket/customer/category/analytics hooks…

    // Determine Page Designer mode from URL - use req for server-side detection
    const pageDesignerMode = useMemo(() => {
        const queryParams = location?.search || ''
        if (queryParams.includes('mode=EDIT')) return 'EDIT'
        else if (queryParams.includes('mode=PREVIEW')) return 'PREVIEW'
        return undefined
    }, [req?.url])

    return (
        <Box className="sf-app">
            <StorefrontPreview getToken={getTokenWhenReady} getBasePath={getRouterBasePath}>
                <IntlProvider /* … */>
                    <CurrencyProvider currency={currency}>
                        <Box as="main" id="app-main" role="main" /* … */>
                            <PageDesignerProvider
                                clientId="pwa-kit-client"
                                targetOrigin="*"
                                usid={usid}
                                mode={pageDesignerMode}
                            >
                                <PageDesignerInit />
                                {children}
                            </PageDesignerProvider>
                        </Box>
                    </CurrencyProvider>
                </IntlProvider>
            </StorefrontPreview>
        </Box>
    )
}

const App = (props) => {
    const location = useLocation()
    const {req} = useServerContext()
    const pathname = req?.url ? req.url.split('?')[0] : location?.pathname || ''
    const isComponentPreview = COMPONENT_PREVIEW_PATH_RE.test(pathname)

    return isComponentPreview ? <ComponentPreviewApp {...props} /> : <StorefrontApp {...props} />
}

export default App
```

**Key points:**

- **`initializeRegistry()` runs at module load**, not inside a component, so components are registered before SSR renders.
- **The shell split is the point, not just hiding chrome.** `ComponentPreviewApp` deliberately omits basket, customer, category, analytics, and shopper-agent hooks. Those mutate session state and fire analytics, which must not happen inside an authoring iframe. It keeps only i18n, currency, the `StorefrontPreview` postMessage bridge, and the Page Designer context.
- **`pageDesignerMode`** is derived via `useMemo` from the URL (`mode=EDIT` / `mode=PREVIEW`), memoized on `req?.url` for SSR safety. The same pattern is used in `StorefrontApp`.
- **Both shells wrap children in `<PageDesignerProvider clientId="pwa-kit-client" targetOrigin="*" usid={usid} mode={pageDesignerMode}>` around `<PageDesignerInit />`.**

`PageDesignerInit` blocks navigation while in design mode (so clicking links inside the canvas does not navigate away) and lazily loads the Page Designer design stylesheet:

```jsx
// file: app/components/page-designer-init/index.jsx  (excerpt)

import {usePageDesignerMode, useGlobalAnchorBlock} from '@salesforce/commerce-sdk-react/page-designer'

export function PageDesignerInit() {
    const {isDesignMode} = usePageDesignerMode()

    // Block anchor navigation when in design mode
    useGlobalAnchorBlock(isDesignMode)

    useEffect(() => {
        if (!isDesignMode) return
        // …inject static/pd-design-styles.css once…
    }, [isDesignMode])

    // Returning false from Prompt's message blocks navigation with no dialog
    return <Prompt when={isDesignMode} message={() => false} />
}
```

> This validates the earlier draft's "preview-specific shell" section — that part was correct. Keep it, grounded in the symbols above (`ComponentPreviewApp`, `COMPONENT_PREVIEW_PATH_RE`, `PageDesignerProvider`, `PageDesignerInit`).

---

## Step 6 — SSR: handle the `default` pseudo-locale

Commerce Cloud builds the iframe URL using SFCC's `default` **pseudo-locale** token — the platform convention meaning "the site's default locale." PWA Kit's route matcher only accepts real locale ids/aliases from the site config, so `/{site}/default/preview/component` matches no route and falls through to Page Not Found. Add a scoped redirect that translates `default` into the site's actual default locale.

```js
// file: app/ssr.js  (inside runtime.createHandler, before app.get('*', runtime.render))

import {getSiteByReference} from './utils/site-utils.js'

// The Content Block Editor (Page Designer) builds the component-preview iframe URL
// with SFCC's `default` pseudo-locale token (the platform's convention for "the site's
// default locale"). PWA Kit's route matcher only accepts real locale ids/aliases from
// the site config, so `/:site/default/preview/component` misses every route and falls
// through to PageNotFound. Translate `default` to the resolved site's actual default
// locale and redirect once so the request matches /:site/:locale/preview/component.
// Scoped to the preview route to leave the public storefront URL model untouched.
app.get('/:site/default/preview/component', (req, res, next) => {
    const site = getSiteByReference(req.params.site)
    const defaultLocale = site?.l10n?.defaultLocale
    if (!defaultLocale) {
        // Can't resolve a locale — let the normal renderer handle it (PageNotFound)
        // rather than emitting a broken redirect.
        return next()
    }
    // Preserve the exact encoded query string (mode, componentId, pdToken, stamp, …).
    const queryIndex = req.originalUrl.indexOf('?')
    const search = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : ''
    res.redirect(302, `/${req.params.site}/${defaultLocale}/preview/component${search}`)
})
```

**Key points:**

- **Scoped to the preview route.** This handler matches only `/:site/default/preview/component`, leaving the public storefront URL model untouched.
- **Preserve the raw query string.** It slices `req.originalUrl` from the first `?` rather than rebuilding from `req.query`, so `mode`, `componentId`, `pdToken`, and `stamp` survive **exactly as encoded** — no re-encoding of the token.
- **302, not 301.** Temporary redirect; `getSiteByReference` always falls back to the default site, so the real guard is on `site?.l10n?.defaultLocale`.

---

## Step 7 — CSP, framing, and cookies

For Commerce Cloud to embed your storefront in an iframe, your Content Security Policy must allow it as a frame ancestor. The `retail-react-app` `ssr.js` already sets this via `helmet`:

```js
// file: app/ssr.js  (helmet CSP directives, excerpt)

'frame-ancestors': [
    // Allow Page Designer to embed the storefront in an iframe
    '*.demandware.net'
]
```

**Key points:**

- **`frame-ancestors: '*.demandware.net'`** authorizes the Business Manager / Page Designer origin to frame the storefront. Adjust the host to match the origin that serves your CBE editor.
- **Prefer `frame-ancestors` (CSP) over relying solely on the postMessage `targetOrigin`.** The `PageDesignerProvider` uses `targetOrigin="*"` for the messaging bridge; CSP `frame-ancestors` is the control that actually restricts who can embed you.
- **Cookies in the iframe.** `localAllowCookies` in `ssr.js` is `false` by default (server-only cookies), which is the secure production setting. Only enable client cookie access for local hybrid-proxy testing, never in production.
- **Caching.** Treat the preview response as private/uncacheable — it carries authoring parameters and reflects unpublished content. Do not add long-lived cache headers to the preview route.

---

## Step 8 — Security: handling `pdToken`

`pdToken` is a short-lived Page Designer authentication token. The implementation handles it safely, and you must preserve these properties:

- **Never logged.** `pdToken` is not written to any logger or `console`.
- **Never re-encoded.** It passes through verbatim — the SSR redirect slices the raw query string (Step 6), and the hook forwards it unchanged.
- **Never placed in the TanStack Query cache key.** In `useComponent`, the query key is built from the API parameters *before* `mode`/`pdToken` are appended, and is then filtered by `pickValidParams` (which keeps only `organizationId`, `componentId`, `siteId`, `parameters`, `locale`). So the token cannot leak into the cache key.
  - **Consequence to be aware of:** because `pdToken`/`mode` are excluded from the key, two previews of the same `componentId` that differ only by token or mode share a cache entry. This is intentional but worth knowing when debugging stale previews — which is what `stamp` is for.
- **`stamp` is the CBE-supplied cache-buster.** It changes per edit to force a fresh render; it is not otherwise consumed by the app.
- **Never emit `Authorization: Bearer undefined`.** If a token is absent, do not construct a bearer header from it.

---

## Step 9 — Test locally and validate on Commerce Cloud 26.8

**Local smoke test.** Start the dev server and hit the route directly with the required params:

```
http://localhost:3000/{site}/{locale}/preview/component?mode=EDIT&componentId={existingComponentId}
```

Expected: the single component renders chrome-free (no header/footer). Without `mode=EDIT|PREVIEW` or without a `componentId`, the page renders nothing (`return null`) — that is correct.

**`default`-locale redirect check.** Request the pseudo-locale form and confirm the 302:

```
http://localhost:3000/{site}/default/preview/component?mode=EDIT&componentId={id}
   → 302 → /{site}/{defaultLocale}/preview/component?mode=EDIT&componentId={id}
```

**On Commerce Cloud 26.8.** In the Content Workspace, open a component in the focused visual canvas. Commerce Cloud loads your MRT storefront in the iframe at the preview route; confirm the component renders and that `frame-ancestors` allows the embed (no CSP violation in the browser console).

> **Note on scoped test runs.** Running `pwa-kit-dev test` against a subset of files prints a trailing `error: Command failed` because the *global* coverage threshold isn't met on a partial run. That is **not** a test failure — check the actual test results above it.

---

## Correcting the earlier draft — summary

| Draft said | Reality (this guide) |
|---|---|
| `commerce-sdk-react@5.4.0-dev` has no `useComponent`; call the raw `getComponent` client with `getTokenWhenReady()` | `5.4.0-dev` **ships `useComponent`**, which is Page-Designer-mode aware. Use the hook. |
| Render with `addDesignDefaults` + `<Region page={page} regionId="preview">` | Use `injectIntoPreviewRegion` + `<Page page={…} components={PAGEDESIGNER_TO_COMPONENT} />` — the same pipeline as full pages. |
| `storefront-next-runtime@0.4.2`, no `RootComponentProvider` | This integration uses **`storefront-next-runtime@1.2.0`**; the missing-provider caveat no longer applies. |
| PWA Kit `3.20.0-dev` | Correct — `3.20.0-dev` is what this integration resolves. |

The draft's **security and hardening guidance was sound** (pdToken redaction, no-query-key, `stamp` cache-busting, CSP `frame-ancestors`, private/no-store caching) and is preserved above, adapted to the verified implementation.

---

## See Also

- **Integrate Page Designer with PWA Kit** — the baseline this guide builds on (registry, `<Page>`/`<Region>` pipeline, building layout and leaf components). Complete that integration first.
