<div class="c-callout">
  <p>
    <strong>Note:</strong> Make sure you've gone through our <a href="../installation">Installation steps</a> before following these instructions to run the development server.
  </p>
</div>

Depending on whether your project is [tag-loaded](../../architecture/#1.-tag-loaded-pwas) or [server-side rendered](../../architecture/#2.-server-side-rendered-pwas), the following instructions will help you get your development server running:

<div class="tabs tabs-3 tabs-line">
<ul>
<li><a href="#tabs-3-tag-loaded">Tag-loaded PWAs</a></li>
<li><a href="#tabs-3-ssr">Server-side rendered PWAs</a></li>
</ul>

<div id="tabs-3-tag-loaded">

<p class="u-margin-bottom">
  Start by running the following commands:
</p>

```bash
cd packages/pwa
npm run tag-loaded
```

<div class="c-callout">
  <p>
    <strong>Note</strong> If those commands didn't work for you, navigate to the <code>packages/pwa</code> directory and then run <code>npm run start:preview</code>
  </p>
</div>

<p class="u-margin-top u-margin-bottom">
  Now that the development server is running, you can open the PWA in a browser:
</p>

1. Go to <a href="https://preview.mobify.com" target="_blank">https://preview.mobify.com</a>
2. Enter the URL for the site that you want to preview in the **Site URL** field
3. Enter the URL for the code bundle you want to load in the **Bundle Location**
   field (This will usually be <a href="https://localhost:8443/loader.js" target="_blank">https://localhost:8443/loader.js</a>.
4. Emulate a mobile device in your browser. Here are some <a href="https://developers.google.com/web/tools/chrome-devtools/device-mode/" target="_blank">instructions for Google Chrome</a>.
   *Do not skip this step!*
5. Click **Preview**

<p class="u-margin-top">

**Success!** You should now see the home page for the PWA in your browser. You can kill the development server at any time by using the keyboard shortcut `Control-C`.

_The site you want to preview must contain the Mobify Tag, and you must emulate a mobile device in your browser before clicking the Preview button. Otherwise, previewing will fail. See the troubleshooting section for tag-loaded PWAs below for more help._

</p>

</div>

<div id="tabs-3-ssr">

<p class="u-margin-bottom">
  Start by running the following commands:
</p>

```bash
cd packages/pwa
npm run ssr
```

<div class="c-callout">
  <p>
    <strong>Note</strong> If those commands didn't work for you, navigate to the <code>packages/pwa</code> directory and then run <code>npm run start:ssr</code>.
  </p>
</div>

<p class="u-margin-top u-margin-bottom">
  Now that the development server is running, you can open the PWA in a browser:
</p>

- Go to <a href="http://localhost:3000/" target="_blank">http://localhost:3000/</a>
- To preview a server-side rendered page, append the `?mobify_server_only` query string to the URL you'd like to preview. For example, you could test the server-side rendered version of www.example.com by visiting the URL www.example.com?mobify_server_only.

<p class="u-margin-top u-margin-bottom">

**Success!** You should now see the home page for the PWA in your browser. You can kill the development server at any time by using the keyboard shortcut `Control-C`.

</p>

</div>
</div>

### Troubleshooting

#### Windows users

<div class="content-accordion u-margin-top">
<h3 class="u-text-medium">If you encounter errors in your terminal while starting your development server...</h3>
<div>

<p class="u-margin-bottom">
  Start by checking which version of Node is installed:
</p>

1. Run `node -v` from your terminal
1. Verify that the version is v10.17.0

<p class="u-margin-top u-margin-bottom">

If you have a different version of Node installed, **do _not_ use nvm to
install the newer version of Node**. Instead, [download the 10.17.0
release](https://nodejs.org/download/release/v10.17.0/) from the Node.js
archive.

</p>

<p class="u-margin-top u-margin-bottom">
  Now reinstall your dependencies:
</p>

1. Delete your `node_modules` directory
1. Repeat the steps to run your development server and preview your work
1. Don’t forget to check your Node version before running `npm install` again

</div>
</div>

#### Mac users

<div class="content-accordion u-margin-top">

<h3 class="u-text-medium">If you encounter errors in your terminal while starting your development server...</h3>
<div>

1. Install [Node Version
   Manager](https://github.com/creationix/nvm#installation) (nvm)
1. Open your terminal and run `nvm install 10.17.0`
1. Delete your `node_modules` directory
1. Repeat the steps to run your development server and preview your work
1. Don’t forget to check your Node version before running `npm install` again

</div>
</div>

#### Tag-loaded PWAs

<div class="content-accordion u-margin-top">
<h3 class="u-text-medium">If you see a blank, white screen while loading...</h3>
<div>

1. Clear your cookies for localhost and merlinspotions.com
1. Go to the terminal window running your development server
1. Press `Control-C` to stop the development server
1. Run `npm run tag-loaded`
1. Copy the preview URL from the terminal output
1. Paste the URL into your browser
1. Emulate a mobile device using your browser’s developer tools. <br />*You must do this before the next step!*
1. Click the **Preview** button

</div>
<h3 class="u-text-medium">If you see the desktop site instead of the PWA...</h3>
<div>

1. Open Chrome’s DevTools
1. Go to **Application** tab in the DevTools window
1. Click the **Clear site data** button
1. Verify that your local development server is running
1. Copy the Preview URL from the terminal again
1. Load the Preview URL (but don’t click the Preview button yet!)
1. Emulate a mobile device using Chrome’s DevTools
1. Click the **Preview** button

</div>
<h3 class="u-text-medium">If the PWA still doesn’t load...</h3>
<div>

Start by verifying that the development server is running. You will know that your server is running when you see a message in your terminal window which states: "Server started ✓" with "Access URLs" listed below.

<p class="u-margin-top u-margin-bottom">
  If your development server is not running, ask yourself:
</p>

- Did you run `npm run tag-loaded` from the `packages/pwa` directory?
- Did the command fail because something else is running on the same port?
- Did you click through your browser’s warning about the self-signed certificate?
- Did you open the correct URL?

</div>
</div>

## Next steps

Now that you've finished setting up the Mobify Platform, head on over to our [Orientation Exercises](../orientation-exercises/) and use your first SDK Component!
