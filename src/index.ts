import { defineHook } from '@directus/extensions-sdk';
import { encode } from 'blurhash';

// The more components you have, the more detailed your blurhash. You can
// play around on https://blurha.sh/ to see how it changes. 4 is the default.
const BLURHASH_COMPONENTS = 4;

// Sharp is a Directus dependency
const sharp = require('sharp');

// Convert an image file inside a Buffer into a blurhash string
const bufferToBlurhash = (buffer: Buffer) => (
  new Promise((resolve, reject) => {
    // Shame that although this image has just _been_ through sharp to resize
    // it, we have to reprocess it.
    //
    // I stole this mostly from 
    // https://github.com/woltapp/blurhash/issues/43
    sharp(buffer)
      .raw()
      .ensureAlpha()
      .toBuffer((err: Error, buffer: Buffer, { width, height }: {width: number, height: number}) => {
        if (err) return reject(err);
        resolve(encode(new Uint8ClampedArray(buffer), width, height, BLURHASH_COMPONENTS, BLURHASH_COMPONENTS));
      }); 
  })
);

export default defineHook(({ action }, {services, database}) => {
  // Pull out some references to the services we need. These are defined in
  // https://github.com/directus/directus/tree/main/api/src/services.
  //
  // It's not _immediately_ clear if Directus intends for us to access these
  // directly, but given that it passes them in as an argument I assume so.
  const AssetsService = services.AssetsService;
  const ItemsService = services.ItemsService;

  // ctx has database, schema, accountability.
  // See https://docs.directus.io/extensions/hooks/#action
  action('files.upload', async ({key}, ctx) => {
    // Typescript says schema might be undefined... :shrug:
    if (!ctx.schema) {
      console.warn("[Blurhash] Was not given schema. Can't do anything");
      return;
    }

    // Check that images have a blurhash field, if not, warn that migration
    // needs to be run and do nothing.
    if (!ctx.schema.collections.directus_files?.fields?.blurhash) {
      console.warn('[Blurhash] Migration needs to be run to add blurhash field to images');
      return;
    }

    // Set up some instances of the services we need. Again it's not
    // immediately obvious if you're supposed to do this, but it works!
    const assetService = new AssetsService({knex: database, schema: ctx.schema});
    const itemService = new ItemsService('directus_files', {knex: database, schema: ctx.schema});

    // Make the image smaller to reduce time taken to generate blurhash.
    // Could experiment with dimensions for different effects.
    console.log('[Blurhash] Fetching resized image');
    // Directus will ignore our requests to resize if its not an image. We'll
    // check in a minute.
    const result = await assetService.getAsset(
      key,
      {
        transformationParams: {
          key: undefined,
          withoutEnlargement: true,
          width: 200,
          quality: 80
        }
      }
    );

    // List of file types from 
    // <https://github.com/directus/directus/blob/main/api/src/services/assets.ts>
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/tiff'].includes(result.file.type)) {
      console.log('[Blurhash] Not an image, skipping');
      return;
    }

    // Directus returns a ReadStream, but Sharp doesn't like those, so convert
    // to a buffer.
    let buf = Buffer.from('');
    result.stream.on('data', (chunk: Uint8Array) => {
      buf = Buffer.concat([buf, chunk]);
    });
    result.stream.on('end', async () => {
      // We've read the whole file; convert to a blurhash...
      const blurhash = await bufferToBlurhash(buf);
      // ...and update the database! Phew, we're done.
      itemService.updateOne(key, {blurhash});
    });
  });
});
