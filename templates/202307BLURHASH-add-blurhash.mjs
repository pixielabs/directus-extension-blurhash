// Added by @pixielabs/directus-extension-blurhash
export async function up(knex) {
  await knex.schema.alterTable('directus_files', (table) => {
    table.text('blurhash');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('directus_files', (table) => {
    table.dropColumn('blurhash');
  });
};
