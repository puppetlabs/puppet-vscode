#!/usr/bin/env bash
# requires: mkdocs, mkdocs-windmill, rsvg-convert, jq
# Copy Project metadocs:
mkdir -p ./docs/about/readmes ./docs/img
# Skip the badges in the docs
tail -n +4 ./client/README.md > ./docs/about/readmes/Client.md
cp -r ./client/docs/assets      ./docs/about/readmes
cp ./server/README.md           ./docs/about/readmes/Language_Server.md
cp ./CONTRIBUTING.md            ./docs/about/Contributing.md
cp ./CODE_OF_CONDUCT.md         ./docs/about/Code_of_Conduct.md
# Copy over but drop the title for formatting
tail -n +3 ./client/CHANGELOG.md > ./docs/about/Change_Log.md
# Copy over the license, but place in a nohighlight preformatted block.
echo -e "\`\`\`nohighlight\n$(cat LICENSE)\n\`\`\`" > ./docs/about/License.md
# Convert the logo to png, copy to the docs folder; do it smaller for favicon
rsvg-convert -h 80 ./client/images/puppet_logo_sm.svg > ./docs/img/logo.png
rsvg-convert -h 32 ./client/images/puppet_logo_sm.svg > ./docs/img/favicon.ico
# Parse Package.json, grab latest version, add to mkdocs config
echo -e "\n  version: $(cat ./client/package.json | jq -r .version)" >> ./mkdocs.yml