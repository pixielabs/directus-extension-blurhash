# Setup

1. `npm i`
2. Add a migration to your Directus project:

    ```
    // extensions/migrations/xxxxx-add-blurhash.js
    module.exports = {
      async up(knex) {
        await knex.schema.alterTable('directus_files', (table) => {
          table.text('blurhash');
        });
      },

      async down(knex) {
        await knex.schema.alterTable('directus_files', (table) => {
          table.dropColumn('blurhash');
        });
      },
    };
    ```

# Build

```
npm run build
```

# Install

Copy the output of `dist/` after running the build command into your Directus
project under `./extensions/hooks/blurhash/`.

# Developing

```
npx directus-extension build -o /path/to/your/directus/extensions/hooks/blurhash/index.js  -w
```
