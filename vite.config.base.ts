import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineDynamicResource, ManifestV3Export } from '@crxjs/vite-plugin';
import { defineConfig, BuildOptions } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths'
import { stripDevIcons,  } from './custom-vite-plugins';
import manifest from './manifest.json';
import devManifest from './manifest.dev.json';
import pkg from './package.json';


const isDev = process.env.__DEV__ === 'true';
// set this flag to true, if you want localization support
// const localize = false;

export const baseManifest = {
  ...manifest,
  version: pkg.version,
  // content_scripts: [
  //   ...manifest.content_scripts,
  //   ...(isDev ? devManifest.content_scripts : []),
  // ],
  // host_permissions: [
  //   ...manifest.host_permissions,
  //   ...(isDev ? devManifest.host_permissions : []),
  // ],
  // ...(localize ? {
  //   name: '__MSG_extName__',
  //   description: '__MSG_extDescription__',
  //   default_locale : 'en'
  // } : {})
  web_accessible_resources: [
    ...manifest.web_accessible_resources,
    defineDynamicResource({
      matches: ["*://*.youtube.com/*", "*://*.holodex.net/*"],
    }),
    defineDynamicResource({
      matches: ["*://*.youtube.com/*"],
    }),
    defineDynamicResource({
      matches: [
        "*://*.holodex.net/*",
        "http://localhost:8080/*",
        "http://127.0.0.1:8080/*",
      ],
    }),
  ],
} as ManifestV3Export;

export const baseBuildOptions: BuildOptions = {
  sourcemap: isDev,
  emptyOutDir: !isDev
}

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    stripDevIcons(isDev),
    // crxI18n({ localize, src: './src/locales' })
  ],
  publicDir: resolve(__dirname, 'public'),
});
