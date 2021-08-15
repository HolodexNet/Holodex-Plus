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
- in `src/content`, reload the website you're testing on

The only exception is `src/background`, where you have to go to [`chrome://extensions`](chrome://extensions) and manually reload the extension.

To open devtools for:

- `src/popup`, right-click the extension icon next to the address bar, and click `Inspect popup`
- `src/background`, go to [`chrome://extensions`](chrome://extensions), and go to the extension's `Details`, then under `Inspect views`, click `background page`

`src/options` devtools can be accessed normally, and `src/content` uses the active tab's devtools.
