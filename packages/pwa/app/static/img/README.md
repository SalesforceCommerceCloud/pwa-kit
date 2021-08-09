# Note About `/img` Directory

All images **must live in a sub-directory** within `app/static/img/`. The reason is to ensure that all images be correctly picked up by the image optimization task `npm run clean:images`. See `package.json` to see how that task is configured.
