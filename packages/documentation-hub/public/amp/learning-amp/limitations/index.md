AMP is so fast is because it restricts how pages may be coded, and the [AMP Validator](https://validator.ampproject.org/) will invalidate pages that do not meet the necessary requirements. It is important to realise that a customer’s site design may not translate perfectly into an AMP page, or deliver all the same functionality. Here are some areas where you’ll need to keep these limitations in mind:

### Javascript

AMP only supports a Google-supplied JavaScript library, which is very limited in what it can do. As ecommerce sites tend to use multiple Javascript libraries to serve or switch content dynamically, it is very possible that certain functionality will simply not be achievable. Compare examples in [Common Issues & Workarounds](../../designing-for-amp/common-issues-and-workarounds/).

### CSS

No external CSS is permitted on the AMP document, and inline CSS cannot exceed 50kb. This can affect a design-rich site design that requires a lot of intricate styling and code-heavy SVGs.

### Fonts

The way AMP renders anything other than system fonts can put restrictions on the site design. AMP can render webfonts from external sources, however anymore more than a single font and weight may cause problems with HTML file size, causing the AMP validator to fail.

### Animation

AMP restricts animations to two methods, transform and opacity. Most animations can be made to work using these two properties but designers should be aware if the design relies on more complex animation techniques to work.
