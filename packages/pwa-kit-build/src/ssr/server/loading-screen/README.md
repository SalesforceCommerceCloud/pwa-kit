# Loading Screen

This is the loading screen that the users would see in their browser when they run `npm run start` in their app's directory. The script would initially start the dev server and make the build. When the build is done, the loading screen would disappear, as it redirects to their app's homepage.

## One Single HTML

It's a self-imposed constraint to keep all the html, css, js, and assets within a single html file. This would make the workflow simpler for developers, designers, and others who wish to update the textual content in the future. They can edit the text directly in the html and easily preview the changes on their browser (without needing to clone the repo and run some scripts in the terminal).

## Updating Text

Search for the text you wish to update in the html and edit them directly. It's also possible to tweak the timing of when this text rotates by updating the corresponding `data-*` attribute.

### Workflow

Typically, the workflow for updating textual content would look like this:

1. Edit the html file directly.
2. Open the html in your browser to preview the changes.
3. Push your changes via pull request.
4. Eventually, they will be deployed in the upcoming release.

For those who are comfortable with the terminal, they can also test the text changes locally through the dev server. Here's how to do it:

1. In the `pwa-kit-build` package (where the loading screen resides), run `npm run build` to build your changes.
2. Then switch to the `pwa` package, and run `npm run start` from there.
3. Verify the changes to the loading screen.

## Updating Images

As for images, you may have noticed that they're inline in the html. 

- For SVGs, you can copy their code and paste them into the html.
- For other kinds of images, you'd need to encode them with base64 first, before you can paste it into the html.

### Workflow

This is the workflow that we've followed:

1. First of all, compress the images with a tool like [ImageOptim](https://imageoptim.com/mac)
2. Then encode them with base64 with a tool like [`image2base64-cli`](https://github.com/plantain-00/image2base64-cli): `npx image2base64-cli *.gif --json gif.json`
3. Open up the resulting json file
4. Copy and paste the base64 data into the html
