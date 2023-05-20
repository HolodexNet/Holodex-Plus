import type { ProtoframeDescriptor } from "protoframe";

export const tlsyncProtocol: ProtoframeDescriptor<{
  initiate: {
    body: { info?: string };
    response: { state: "ok" | "failed" };
  };
  sendMessage: {
    body: { text: string };
  };
}> = { type: "tlsync_msgs" };
