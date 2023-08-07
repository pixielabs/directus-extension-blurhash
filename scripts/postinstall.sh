#!/usr/bin/env bash

set -e

# Copy our migration template to the extensions/migrations folder in the
# project root.
echo "[blurhash postinstall] Copying migration template to extensions/migrations"
mkdir -p $INIT_CWD/extensions/migrations
cp -v $INIT_CWD/node_modules/@pixielabs/directus-extension-blurhash/templates/202307BLURHASH-add-blurhash.mjs $INIT_CWD/extensions/migrations/
