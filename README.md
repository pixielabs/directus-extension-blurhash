Requires Directus 10. May work on Directus 9 with some tweaking, YMMV.

# Setup

1. `npm i @pixielabs/directus-extension-blurhash --save`. A post-install script
   will add a migration to your `extensions/migrations` folder.
2. Restart your Directus app if necessary.

# Development

```
$ npm i --ignore-scripts
$ npm run dev
```

In another terminal, go to your directus installation and:

1. Copy the migration from this folder
2. Use `wml` to auto-copy changes during dev (a symlink stops Node from 
   resolving our Sharp dependency).

   ```
   wml add path/to/@pixielabs/directus-extension-blurhash node_modules/@pixielabs/directus-extension-blurhash
   # Accept the defaults
   wml start
   ```

   If `wml start` does nothing, check [this issue for a fix](https://github.com/wix-incubator/wml/issues/48).

2. Start Directus (`npx directus start`)
