# 🏝️️Islands

Inspired by [Astro’s islands architecture](https://docs.astro.build/en/concepts/islands/), this component is intended to give developers explicit and fine-granular control over the hydration behavior of their experiences.

> **ℹ️ Important:** The aspect of **inspiration** is crucial to emphasize. This component merely attempts to **mimic** some of the islands architecture’s behaviors. It needs to be understood as a single tool in a larger toolbox, which is intended to eventually help address very specific performance problems in connection with server-rendered components and their subsequent hydration on the client. So this is neither a silver bullet nor a construct that is guaranteed to work for every use case. Use it wisely and carefully.

# 🧟️ Hydration’s Curse

> **ℹ️ Definition:** Hydration is the process of making a server-rendered HTML page interactive, i.e. bridging the gap between server-side rendering (SSR) and client-side interactivity.

Our Composable Storefront applications are server-rendered Single-Page Applications (SPAs). During hydration, the client takes over the server-rendered HTML, restores client-side interactivity and transitions the application into its fully-functional SPA mode.

Behind the scenes, this **restoration of interactivity is computationally very expensive**. This may sound surprising, since hydration from the outside seems to only be about applying certain event listeners to certain elements. Unfortunately, the reality is much more complex. Even though the HTML/DOM already exists, **React must reconcile and often re-execute render logic across the entire application**, which can feel like a re-render and be similarly costly.

In this way, discrepancies between the HTML generated on server and client are detected, reported, and corrected/replaced. On the flipside, the consequence of this behavior is that large amounts of server-rendered HTML directly correlate with extensive re-rendering processes on the client. The results are long-running JavaScript processes blocking the main thread, thereby preventing other (bootstrapping) operations or user interactions from occurring in a timely manner.

> **💩 Gotcha:** With the good intention of optimizing important (Core) Web Vitals of your website, such as [FCP](https://web.dev/articles/fcp) or [LCP](https://web.dev/articles/lcp), you immediately run into problems with other performance metrics such as [TTI](https://web.dev/articles/tti) or [TBT](https://web.dev/articles/tbt).

# 🚱 Partial Hydration

Hydration in React by default is an all-or-nothing game. But if this game is about lost customers and revenue, it’s an expensive game in multiple ways.

> 💡 The core idea behind solving the problem is quite simple: Avoid hydration wherever possible, and if it’s unavoidable, ensure interactivity is restored in the user’s viewport as quickly as possible and with the highest priority.

Ultimately, the goal is to reduce the load on the browser’s main thread, which can otherwise easily be overwhelmed by the sheer volume of JavaScript to be processed on initial page load. Achieving an efficient compute reduction requires decisions during the development process on how to best break down a page into smaller, meaningful islands of interactivity.

## React’s Selective Hydration ≠ Partial Hydration

React 18, with [`Suspense`](https://react.dev/reference/react/Suspense), laid the foundation to officially support concepts such as [selective hydration](https://github.com/reactwg/react-18/discussions/37). However, while the Islands Architecture concept treats partial and selective hydration as interchangeable terms, React’s understanding of selective hydration differs in key aspects.

`Suspense` _delays the **rendering** of certain components altogether_ and instead enables the display of specified fallback content while the actual content is loading.

When using `Suspense`, certain contents are therefore not rendered on the server at all, but instead asynchronously on the client at a later time only — with all the associated implications for accessibility and SEO. Depending on the runtime used, the boundaries can be fluid as to when the asynchronous loading of the actual/final content begins — whether already on the server or only on the client — but the outcome remains the same: **`Suspense` enables asynchronous rendering, not asynchronous hydration.**

In addition to `Suspense`, [React Server Components](https://react.dev/reference/rsc/server-components) (RSC) are now another powerful official concept in React for addressing the all-or-nothing problem with hydration. Server Components are components that are rendered exclusively on the server and therefore don’t receive any downstream client-side hydration. In fact, when using RSCs, only the JavaScript that is absolutely necessary to restore application state and interactivity is sent to the client. If used sensibly, RSCs in combination with client components - defined via the `use client` directive - enable a very granular control over the sections of an application requiring hydration. However, it’s then still not possible to actively influence the timing of when the hydration of specific sections should occur.

## `<Island/>` Component

Unlike `Suspense`, the `<Island/>` component explicitly **encourages the synchronous rendering of HTML on the server** as much as possible. And instead of delaying the rendering of certain contents, it allows the **explicit delay of the hydration process itself**.

This delay can be achieved using various `hydrateOn` strategies:

1. `hydrateOn={'load'}`: Useful for high-priority UI elements that need to be interactive as quickly as possible. Default behavior if `hydrateOn` is not defined.
2. `hydrateOn={'idle'}`: Useful for lower-priority UI elements that don’t need to be immediately interactive. Hydration occurs during the [browser’s next available idle period](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback).
3. `hydrateOn={'visible'}`: Useful for lower-priority UI elements that don’t need to be immediately interactive. Hydration occurs once the component has [entered the user’s viewport](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver). As a result, such an element doesn’t get hydrated at all if the user never sees it.
4. `hydrateOn={'off'}`: Useful for non-interactive UI elements or lower-priority UI elements to completely suppress the hydration for. On the surface, this behavior overlaps in certain ways with Server Components. However, there are fundamental differences. While server components don’t contribute any JavaScript to what’s delivered to the client, islands are client-oriented constructs, and thus the JavaScript for a non-hydrated section is still fully transmitted. After all, `hydrateOn` can be dynamically updated at any time in case of using a binding property instead of a hard-coded value. An initial value of `off` therefore opens up the possibilities for completely custom hydration triggers. Furthermore, if Server Components aren’t supported by the runtime used, `hydrateOn={'off'}` offers a simple way to at least reduce the hydration overhead for certain non-interactive areas.

> **🔀️ Important:** Partial hydration support is put behind a feature toggle that can be turned on by setting the constant `PARTIAL_HYDRATION_ENABLED` to `true` (see `@salesforce/retail-react-app/app/constants`).

> **ℹ️️ Note:** `<Island/>` components only influence the hydration behavior of server-rendered content. Once an application bootstrapped on the client and returned to SPA mode, any subsequent client-side rendering is not impacted by the `<Island/>` components anymore.

> **❗ Important:** Ultimately, the approaches of `Suspense`, Server Components and the `<Island/>` component aren’t mutually exclusive; on the contrary, they can perfectly complement each other.

## `<Island/>` Nesting

It’s possible to construct nested `<Island/>` structures. However, it’s important to note that inner islands are always hydrated according to their own configuration, but only **depending on the hydration status of their parents**. To avoid unexpected side effects caused by non-hydrated — and therefore non-interactive — content, it’s crucial to avoid conflicting hydration configurations within parent/child `<Island/>` structures.

# ⚠️ Danger Zone

> ❗ As is often the case in life, this guiding principle also applies to the `<Island/>` concept: **With great power comes great responsibility.**

The fundamental idea behind islands is to break up typically long-running and blocking threads into smaller, non-blocking chunks, allowing the browser to establish user interactivity more quickly overall.

Therefore, a frequently used approach is to present the user with server-generated static markup for as long as possible, and to hydrate specific sections only when it truly becomes necessary in order to respond to potential user interactions in a timely manner.

If not checked or not even considered during development, this behavior can lead to occasionally subtle issues:

1. An `<Island/>` might contain unhydrated content that is relevant for side effects or tasks such as metrics tracking. In its unhydrated static state, certain event or beacon submissions may therefore not occur. _Please test the correct functionality of all conditionally/partially hydrated areas carefully._
2. Certain configurations can simply miss to make specific sections interactive in time — or at all. In such cases, end users may become frustrated when faced with seemingly interactive content that doesn’t respond to interactions or otherwise behaves unexpectedly.
3. An `<Island/>` may wrap sections that render different content on the server than on the client. Depending on the timing of hydration or the placement of the `<Island/>` within the user’s initial viewport, such content mismatches can cause unexpected layout shifts.
4. Managing focus states, keyboard navigation, and screen reader announcements across the boundary between static and interactive content requires careful coordination.

These challenges aren’t insurmountable, but they require careful architectural planning and testing to address effectively.
