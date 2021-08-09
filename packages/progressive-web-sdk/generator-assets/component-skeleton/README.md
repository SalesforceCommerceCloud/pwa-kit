<% if (context.IN_SDK) {%>```js
// JS import
import <%= context.Name %> from 'progressive-web-sdk/dist/components/<%= context.dirname %>'

// SCSS import
@import 'node_modules/progressive-web-sdk/dist/components/<%= context.dirname %>/base';
```
<% } else { %>```js
// JS import
import <%= context.Name %> from '../components/<%= context.dirname %>'

// SCSS import
@import '../components/<%= context.dirname %>/base';
```
<% } %>

## Example Usage

    <<%= context.Name %> text="Hear me roar!" />
