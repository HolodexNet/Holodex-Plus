# Holodex-Plus

Holodex.net Companion Extension

### Local development (Chrome)

```
$ yarn
$ yarn dev
```

Then go into [`chrome://extensions`](chrome://extensions), and `Load unpacked` -> Select this project's `build` folder.

Hot refresh doesn't exist, but the files are watched and re-built when changed. To see your changes

- in `src/popup`, close and re-open the popup
- in `src/options`, reload the options page
- in `src/content`, reload the extension in [`chrome://extensions`](chrome://extensions), then reload the page the content script is running in
- in `src/background`, reload the extension in [`chrome://extensions`](chrome://extensions)

To open devtools for:

- `src/popup`, right-click the extension icon next to the address bar, and click `Inspect popup`
- `src/background`, go to [`chrome://extensions`](chrome://extensions), then go to the extension's `Details`, then under `Inspect views`, click `background page`
- `src/options`, go to [`chrome://extensions`](chrome://extensions), then go to the extension's `Details`, then click `Extension options`, which will open a new tab where you can open devtools normally
- `src/content`, open devtools on any page where the content script is running

### Local development (Firefox)

```
$ yarn
$ yarn dev
```

Navigate to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox), and `Load Temporary Add-on...` -> Select the `manifest.json` file inside of this project's `build` folder.

Reloading works the same way as in Chrome, but devtools works a bit differently from Chrome. `popup`, `background`, and `options` all output their content into the same inspection tool available through [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox) -> `Inspect`.

Just like in Chrome, `options` can also be inspected normally by opening devtools on the options page, and content scripts output their logs into the opened page's devtools console.

You can inspect the sources of `popup` by opening the `Debugger` tab in the inspection tool, and selecting the source file on the left side.
