## 1. Set up your environment

The following setup is required to develop push notifications projects.

### Grunt CLI

Grunt can be installed as follows:

```c
# Grunt: http://gruntjs.com
npm install -g grunt-cli
```

### Grunt init

We use [grunt-init](http://gruntjs.com/project-scaffolding/) to streamline the
creation of push notifications projects.

```c
# Install `grunt-init`: http://gruntjs.com/project-scaffolding
npm install -g grunt-init
```

### Web push template

This installs the `grunt-init-webpush` template to the correct location so that
it can be used to create new projects.

```c
# Install the template:
git clone git@github.com:mobify/grunt-init-webpush.git ~/.grunt-init/webpush
```

## 2. Create the project

```c
cd /path/to/your/project-root
grunt-init webpush
```

At this point, please follow the command prompts to configure your project.
The following table contains detailed information about each [prompt question](#prompt-details).

### Site ID

Each web push notifications project is identified by a unique ID, called the **Site ID**.
The site ID is configured in Mobify Cloud.

### Prompt Details

| Prompt                 | Values (default)             | Description                |
| ---------------------- | ---------------------------- | ---------------------------|
| site_id                |                              | The Site ID slug for this project.
| mobify_hosted          | (y), n                       | If the project is [Mobify-hosted or Customer-hosted](../hosting-option)
| iframe                 | (bottom), top                | To show the iframe at the top or bottom of the page. This is for the opt-in and confirmation.
| font_family            | Arial, Helvetica, sans-serif | The font-family to use for the project.
| container_width        | 950px                        | The body width of the client's site.
| brand_color            | #aaa                         | The client's brand color. The buttons and icons will default to this color.
| checkout_flow_path     | /checkout                    | The url path of the checkout flow pages. The opt-in should not show when in checkout pages, and so it will be disabled when the url matches this path.            |

### Project structure

All required webpush files should live in the `custom/production/` folder. The `/src` folder houses the sass files which will be compiled and saved into the `custom/production/styles` folder.

    /custom
        /production                     # Root folder of what gets deployed
            /images
                icon-*.svg              # SVG icons used in the opt-in dialog
                notification-icon.png   # A square 192x192px logo used in notifications
                icon256x256.png         # A square 256x256px logo used by Safari
                logo.png                # The logo in its original shape
                logo@2x.png             # Same as logo.png, but double its dimensions
            /js
                webpush-shared.js       # A common customizable script for soft-ask, soft-dismiss, and confirmation banner dialogs
            /styles
                stylesheet.css          # The generated CSS file
            *.html                      # Raw HTML files that dictate the opt-in and subscription page
            custom.js                   # The script to tailor web push behaviour to client's requirements
    /src
        /sass                           # Raw SCSS files
    /tests                              # A Nightwatch.js test suite for automated tests
    <site-id>.yml                       # The configuration file used by the backend system
    web.*.pem                           # A certificate to enable messaging for Safari

## 3. Install project dependencies

The following command installs all required project dependencies:

```c
# NPM
npm install
```
