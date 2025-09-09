# itgiup-lwc-plugins - Lightweight Charts™ Plugin

Description of the Plugin.

- Developed for Lightweight Charts version: `v5.0.0`

## Running Locally

```shell
yarn install
yarn run dev
```

Visit `localhost:5173` in the browser.

## Compiling

```shell
yarn run compile
```

Check the output in the `dist` folder.

## Publishing To NPM

You can configure the contents of the package's `package.json` within the
`compile.mjs` script.

Once you have compiled the plugin (see above section) then you can publish the
package to NPM with these commands:

```shell
cd dist
yarn publish
```

Hint: append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to NPM.
