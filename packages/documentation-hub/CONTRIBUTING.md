### 🤔 How to...

#### 👉 Change the look and feel:
Layouts, styling, and utility scripts are controlled by
[Mobify's Documentation Theme](../documentation-theme) to keep things in our
docs looking consistent. Those types of changes must be made in the
documentation-theme.

#### 👉 Edit a document:

1. Find the document on `docs.mobify.com`.
1. Check the URL components: `docs.mobify.com/<component>/<version>/<category>/<slug>`)
1. **Editing content:**
 - Update `public/<component>/<version>/<category>/<slug>/index.md` using markdown like a champ.
1. **Editing intros, titles:**
 - Open `public/<component>/<version>/_data.json`.
 - Find it's JSON object and edit the `title` and/or `intro` field.
1. ~~**Editing slugs (NOT RECOMMENDED):**~~
 - Just don't do it.

#### 👉 Add a document:

1. Find the category folder for your doc: `public/$COMPONENT/$VERSION/$CATEGORY`
1. Create a new folder. Name it after how it should appear in the URL.
1. In the folder, create `index.md`.
1. Write your document in [markdown](https://help.github.com/articles/github-flavored-markdown/)!
1. Add your document to it's category in `public/<component>/<version>/_data.json`. Eg.
```js
// Category you're adding to...
"some-category": {
    "title": "Some Category",
    "slug": "some-category",
    "description": "This is some category you might want to update!",
    "docs": [
        // Add one of these!
        {
            "title": "New Document!",
            "slug": "new-document",
            "intro": "This is a document I learned to add by reading CONTRIBUTING.md :D"
        }
    ]
}
```

#### want to add mobile screenshot image on page?
Please use the proper mobile device to screenshot image:
- iOS = **iPhone 7**
- Android = **Nexus 5**

In markdown file, wrap `<div class="u-ios-iphone-7">` for iOS screenshot and  `<div class="u-android-nexus-5">` for Android screenshot around image so it will support retina.

Look at [`/connection-center/1.0/push-notifications/app-push/`](public/connection-center/1.0/push-notifications/app-push/index.md) page for example.

#### add a category
1. Find the appropriate version you wish to add a category to. (eg. `public/v2.0`)
1. Create a new folder in `pages` named with the slug of the category. (eg. `new-category` - lower case and dash delimited words)
1. Create a new file in the folder called `index.jade`.
1. Leave it blank!
1. Add a new category in `public/<version>/_data.json`. Eg.
```js
{
    // Add one of these!
    "new-category-slug": {
        "title": "New Category Title",
        "slug": "new-category-slug",
        "description": "An awesome category I learned to add using CONTRIBUTING.md",
        "docs": []
    }
}
```


#### delete a document
1. Delete the folder for the document from `public/<version>/docs/`.
1. Remove the document from all categories in `public/<version>/_data.json`.
1. Run `node scripts/find-dead-links.js <address-to-docs-site>` to verify that no links are referencing that doc.


#### delete a category
1. Delete the folder for the category from `public/<version>/page`.
1. Remove the category from `public/<version>/_data.json`.
1. Run `node scripts/find-dead-links.js <address-to-docs-site>` to verify no references to the category remain.


#### add a version
1\. Duplicate the latest version of the docs. Eg.
```bash
cp -rf public/v2.0 public/v3.0
```
2\. Update `harp.json` with the new version. Eg.
```js
{
    "globals": {
        "version": "v3.0", // Update this
        "versions": [
            "3.0", // Add this
            "2.0",
            "1.0"
        ],
        "siteTitle": "Mobify – Documentation and Reference",
        "siteDescription": "Mobify Customer Engagement Platform"
    }
}
```
3\. Start modifying the `docs` and `pages`!


### Writing Checklist

Follow the [documentation checklist](https://github.com/mobify/mobify-code-style/tree/master/docs#writing-checklist)
in `mobify/mobify-code-style`.

## Gotchas

- Images should be put in the same folder as the article they reference. They must
  have:
  - [ ] Lower case names, living in the same folder as the article they are used in.
  - [ ] Been put through [`tinypng`](https://tinypng.com/)
- Lines should be wrapped to 80 characters.
- Don't repeat yourself in article names:
  - 👎: `smart-content/smart-content-slots/smart-content-how-to-use-slots/`
  - 👍: `smart-content/slots/introduction`
