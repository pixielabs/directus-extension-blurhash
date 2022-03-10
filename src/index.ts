import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ filter, action }, {services, database}) => {
  const AssetsService = services.AssetsService;
  const ItemsService = services.ItemsService;
  // ctx has database, schema, accountability.
  // See https://docs.directus.io/extensions/hooks/#action
  action('files.upload', async ({key}, ctx) => {
    const assetService = new AssetsService({knex: database, schema: ctx.schema});
    const itemService = new ItemsService('directus_files', {knex: database, schema: ctx.schema});

    const result = await assetService.getAsset(key, {width: 10, quality: 80});

    // TODO: CHECK FOR MIME TYPE!

    const chunks = [];
    result.stream.on('data', chunk => {
      chunks.push(chunk.toString('base64'));
    });
    result.stream.on('end', () => {
      itemService.updateOne(key, {base64: chunks.join('')});
    });
  });
});
