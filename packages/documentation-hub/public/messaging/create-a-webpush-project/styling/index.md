All styling code lives in the `<root>/src/sass` folder.

Below is a list of files of where you would find the matching html:

|Component		|Location		|
|---------------|---------------|
|Soft-Ask		|`custom/production/softask.html`
|Hard-inline-Ask|`custom/production/webpush.html`
|Confirmation	|`custom/production/confirmation.html`

## Coding Style and Standards

Mobify coding styles and standards for HTML, CSS, and JavaScript found on Github: [**Mobify Code Styles**](https://github.com/mobify/mobify-code-style)

## CSS Compilation

From your generated project folder, follow the steps below to compile the Sass files (found in /src folder) into CSS:

-   Run `grunt` from root folder. Grunt will now watch any sass file changes, and automatically re-compile

## Styling Updates

### Device Classes

There are mobify device class that will be append on Mobify hosted asset's `html` tag. The behaviours of these class are defined in `<root>/src/sass/base/_general.scss`

|CSS Class				|
|-----------------------|
|mobify-webpush-desktop	|
|mobify-webpush-mobile	|
|mobify-webpush-tablet	|

### Sass Variables

Start by setting default client styles for the following list of self-explanatory variables. The variables partial can be found at: `src/sass/_variables.scss`

-   **$font-family** (_asked during grunt-init prompts_)
-   **$font-size**
-   **$font-color**
-   **$line-height**
-   **$container-width** (_asked during grunt-init prompts_)
-   **$brand-color** (_asked during grunt-init prompts_)

### SVG Icons

Generic **bell** and **check** icons are included with this project in the `custom/production/images` folder; the **bell** icon is commonly used for the opt-in, and the **check** icon is used for the confirmation. Both these icons are SVG files.

_Note: the default color of these icons is set to the brand-color entered during the grunt-init prompts._

To update the icon colors to match the client's brand, open each file and change the `fill` attribute with client-specific colors.

### Logo

_Note: a logo is only added if there is a subscription page. (i.e. the solution is Mobify-hosted). The icons must always be added._

2 versions of the client's logo:

-   **images/logo.png**: normal DPI logo
-   **images/logo@2x.png**: high DPI logo

width/height dimensions for the logo can be found in  `src/sass/components/_icon.scss`

### Push Notification Icon

A 192x192 pixels icon is required to display for each push notification. See [Default Icon URL](http://docs.mobify.com/push/main/site_configs/reference/#default_icon_url).

-   **images/notification-icon.png**

A 256px by 256px icon is required for Safari push notifications. The name of this icon is fixed and cannot be changed.

-   **images/icon256x256.png**

### Button Styles

Update default generated button styles and hover states to match client's website styling.

Button Sass code to update can be found here: `src/sass/components/_button.scss`
