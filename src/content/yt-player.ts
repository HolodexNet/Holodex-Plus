import { inject, ipc, Options, sha1, validOrigin } from "../util";

const videoId = window.location.pathname.split("/").slice(-1)[0];
if (videoId) {
  inject("content/yt-player-overrides.inject.js");
}
window.addEventListener("message", async (event) => {
  if (validOrigin(event.origin)) {
    if (event.data?.event === "likeVideo") {
      if (!(await Options.get("remoteLikeButton"))) return;
      console.log("[Holodex+] Liking the video");
      const res = await like();
      res ? ipc.send("liked") : ipc.send("failed");
    }
    // else {
    //   console.log(event);
    // }
  }
});

async function getYtLikeData() {
  const doc = await fetch(`https://www.youtube.com/watch?v=${videoId}`).then((r) => r.text());
  const apiKey = doc.match(/"INNERTUBE_API_KEY":"(.*?)"/)?.[1];
  const context = JSON.parse(
    (doc.match(/\(\{"INNERTUBE_CONTEXT":([\w\W]*?)\}\)/) ||
      doc.match(/"INNERTUBE_CONTEXT":([\w\W]*?\}),"INNERTUBE/))?.[1] ?? "{}"
  );
  const ytClientName = doc.match(/"INNERTUBE_CONTEXT_CLIENT_NAME":(\d+),/)?.[1];
  const ytClientVersion = doc.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"(.*?)"/)?.[1];
  const pageId = doc.match(/"DELEGATED_SESSION_ID":"(.*?)"/)?.[1];
  const likeParams = doc.match(/"likeParams":"(.*?)"/)?.[1];
  const removeLikeParams = doc.match(/"removeLikeParams":"(.*?)"/)?.[1];
  const PAPISID = document.cookie.match(/3PAPISID=([^;]*);?.*$/)?.[1];
  if (
    !apiKey ||
    Object.keys(context).length === 0 ||
    !ytClientName ||
    !ytClientVersion ||
    // !pageId ||
    !likeParams ||
    !PAPISID
  ) {
    return null;
  }
  return { apiKey, context, ytClientName, ytClientVersion, pageId, likeParams, removeLikeParams, PAPISID };
}

async function like() {
  const ytLikeData = await getYtLikeData();
  if (!ytLikeData) return false;
  const { apiKey, context, pageId, ytClientName, ytClientVersion, PAPISID, likeParams } = ytLikeData;
  const nowTime = Math.floor(Date.now() / 1000);
  try {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/like/like?key=${apiKey}`, {
      method: "POST",
      referrer: `https://youtube.com/watch?v=${videoId}`,
      mode: "same-origin",
      referrerPolicy: "origin-when-cross-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-AuthUser": "0",
        "X-Goog-Visitor-Id": context.client.visitorData,
        ...(pageId && { "X-Goog-PageId": pageId }),
        "X-Youtube-Client-Name": ytClientName,
        "X-Youtube-Client-Version": ytClientVersion,
        "X-Origin": "https://www.youtube.com",
        "SEC-CH-UA-ARCH": "x86",
        "sec-ch-ua-platform-version": "10.0.0",
        "sec-ch-ua-full-version": "93.0.4577.82",
        Authorization: `SAPISIDHASH ${nowTime}_${await sha1(`${nowTime} ${PAPISID} https://www.youtube.com`)}`,
      },
      body: JSON.stringify({
        context,
        target: { videoId },
        params: likeParams,
      }),
    }).then(async (r) => ({ status: r.status, body: await r.text() }));
    if (res.status === 200) {
      return true;
    }
  } catch (e) {
    console.error("[Holodex+] Error while sending like:", e);
  }
  return false;
}

import { ProtoframeDescriptor, ProtoframePubsub } from "protoframe";

interface Format {
  itag: number;
  url: string;
  mimeType: string;
  bitrate: number;
  width: number;
  height: number;
  lastModified: string;
  contentLength: string;
  quality: string;
  qualityLabel: string;
  projectionType: string;
  averageBitrate: number;
  audioQuality: string;
  approxDurationMs: string;
}

export const ytAudioDLProtocol: ProtoframeDescriptor<{
  fetchAudio: {
    body: { videoId?: string };
    response: { state: "ok" | "failed"; msg: string; format?: Format };
  };
  progress: {
    body: { percentage: number; total: number };
  };
  fetchAudioComplete: {
    body: { audio: Uint8Array; format: Format };
  };
}> = { type: "audio_dl" };

const manager = ProtoframePubsub.iframe(ytAudioDLProtocol);

const DEFAULT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const DEFAULT_FAKE_CONTEXT = (id: string) => ({
  client: {
    hl: "en",
    clientName: "WEB",
    clientVersion: "2.20210721.00.00",
    clientFormFactor: "UNKNOWN_FORM_FACTOR",
    clientScreen: "WATCH",
    mainAppWebInfo: {
      graftUrl: "/watch?v=" + id,
    },
  },
  user: {
    lockedSafetyMode: false,
  },
  request: {
    useSsl: true,
    internalExperimentFlags: [],
    consistencyTokenJars: [],
  },
});

const YT_PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?key=";

manager.handleAsk("fetchAudio", async (body): Promise<{ state: "ok" | "failed"; msg: string; format?: Format }> => {
  if (!body.videoId) {
    console.error("[Holodex+] No video ID");
    return Promise.resolve({ state: "failed", msg: "No Video ID provided", format: undefined });
  }
  try {
    const ytLikeData = await getYtLikeData();
    const { apiKey = DEFAULT_KEY } = ytLikeData || {};

    let data = {
      context: DEFAULT_FAKE_CONTEXT(body.videoId),
      videoId: body.videoId,
      playbackContext: {
        contentPlaybackContext: {
          vis: 0,
          splay: false,
          autoCaptionsDefaultOn: false,
          autonavState: "STATE_NONE",
          html5Preference: "HTML5_PREF_WANTS",
          lactMilliseconds: "-1",
        },
      },
      racyCheckOk: false,
      contentCheckOk: false,
    };

    const url = YT_PLAYER_URL + apiKey;

    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    const res = await fetch(url, options);
    const mediaData = res.json();
    const smallestFormat = getSmallestUriWithAudio(mediaData);

    if (!smallestFormat)
      return {
        state: "failed",
        msg: "No suitable format of Audio-Onlyfound. Please wait for Youtube to finish processing, or maybe you are unlucky.",
        format: undefined,
      };

    setTimeout(() => downloadAndReport(smallestFormat), 100);

    return { state: "ok", msg: "in progress...", format: smallestFormat };
  } catch (e) {
    return { state: "failed", msg: "Error occured: " + new String(e || "???"), format: undefined };
  }
});

async function downloadAndReport(smallestFormat: Format) {
  const response = await fetch(smallestFormat.url, {
    method: "GET",
    headers: {
      "Content-Type": smallestFormat.mimeType,
    },
  });
  const totalBytes = Number(response.headers.get("Content-Length"));
  let downloadedBytes = 0;

  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const x = await reader.read();

    if (x.done) {
      break;
    }

    chunks.push(x.value);
    downloadedBytes += x.value.length;

    const progress = Math.round((downloadedBytes / totalBytes) * 100);
    manager.tell("progress", { percentage: progress * 0.95, total: totalBytes });
  }

  const result = new Uint8Array(downloadedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  manager.tell("progress", { percentage: 100, total: totalBytes });
  manager.tell("fetchAudioComplete", { audio: result, format: smallestFormat });
}

function getSmallestUriWithAudio(mediaData: any): Format | null {
  // Filter out formats that have audio codecs
  const formatsWithAudio: Format[] = [
    ...mediaData.streamingData.adaptiveFormats,
    ...mediaData.streamingData.formats,
  ].filter((fmt: Format) => fmt.mimeType.includes("mp4a") || fmt.mimeType.includes("audio"));

  console.log(formatsWithAudio);

  // If there's no format with audio codec
  if (!formatsWithAudio.length) {
    return null;
  }

  // Sort the formats by contentLength
  const smallestFormat: Format = formatsWithAudio.sort(
    (fmtA: Format, fmtB: Format) => Number(fmtA.contentLength) - Number(fmtB.contentLength)
  )[0];

  console.log(smallestFormat);

  return smallestFormat;
}

