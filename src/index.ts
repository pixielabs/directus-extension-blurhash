import { defineHook } from '@directus/extensions-sdk';
import { encode } from 'blurhash';

// External dependency; already included in Directus
const sharp = require('sharp');

const bufferToBlurhash = (buffer: Buffer) => (
  new Promise((resolve, reject) => {
    sharp(buffer)
      .raw()
      .ensureAlpha()
      .toBuffer((err: Error, buffer: Buffer, { width, height }: {width: number, height: number}) => {
        if (err) return reject(err);
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
      }); 
  })
);

export default defineHook(({ action }, {services, database}) => {
  const AssetsService = services.AssetsService;
  const ItemsService = services.ItemsService;
  // ctx has database, schema, accountability.
  // See https://docs.directus.io/extensions/hooks/#action
  action('files.upload', async ({key}, ctx) => {
    // Check that images have a blurhash field, if not, warn that migration
    // needs to be run.
    if (!ctx.schema) {
      console.warn("[Blurhash] Was not given schema. Can't do anything");
      return;
    }

    if (!ctx.schema.collections.directus_files?.fields?.blurhash) {
      console.warn('[Blurhash] Migration needs to be run to add blurhash field to images');
      return;
    }

    const assetService = new AssetsService({knex: database, schema: ctx.schema});
    const itemService = new ItemsService('directus_files', {knex: database, schema: ctx.schema});

    // Make the image smaller to reduce time taken to generate blurhash.
    // Could experiment with dimensions for different effects.
    console.log('[Blurhash] Fetching resized image');
    const result = await assetService.getAsset(key, {width: 200, quality: 80});

    // List of file types from 
    // <https://github.com/directus/directus/blob/main/api/src/services/assets.ts>
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/tiff'].includes(result.file.type)) {
      console.log('[Blurhash] Not an image, skipping');
      return;
    }

    let buf = Buffer.from('');
    result.stream.on('data', (chunk: Uint8Array) => {
      buf = Buffer.concat([buf, chunk]);
    });
    result.stream.on('end', async () => {
      const blurhash = await bufferToBlurhash(buf);
      itemService.updateOne(key, {blurhash});
    });
  });
});
