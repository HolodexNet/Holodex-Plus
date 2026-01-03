// declare module '*.svg' {
//   import React = require('react');
//   export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
//   const src: string;
//   export default src;
// }

declare module '*.json' {
  const content: string;
  export default content;
}

import type { ProtocolWithReturn } from "webext-bridge";

declare module "webext-bridge" {
  export interface ProtocolMap {
    requestScriptInjection: { scriptType: "YT_CHAT_INJECT" | "YT_PLAYER_INJECT" | "YT_WATCH_INJECT" | "TLSYNC_INJECT" };
    // to specify the return type of the message,
    // use the `ProtocolWithReturn` type wrapper
    bar: ProtocolWithReturn<CustomDataType, CustomReturnType>;

    // TODO: it seems currently we're not actually using webext-bridge for any useful data transmission.
  }
}
