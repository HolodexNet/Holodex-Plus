console.log("[Holodex+]", "Setting YT player overrides");

// List of flags and desired values
const overrides: Record<string, string> = {
  autoplay_time: "8000",
  autoplay_time_for_music_content: "3000",
  csi_on_gel: "true",
  disable_features_for_supex: "true",
  disable_legacy_desktop_remote_queue: "true",
  enable_client_sli_logging: "true",
  enable_gel_log_commands: "true",
  offline_error_handling: "true",
  player_doubletap_to_seek: "true",
  preskip_button_style_ads_backend: "countdown_next_to_thumbnail",
  web_deprecate_service_ajax_map_dependency: "true",
  web_forward_command_on_pbj: "true",
  should_clear_video_data_on_player_cued_unstarted: "true",
  ytidb_fetch_datasync_ids_for_data_cleanup: "true",
  web_player_nitrate_promo_tooltip: "true",
  web_player_move_autonav_toggle: "true",

  enable_cookie_reissue_iframe: "false",
  shorten_initial_gel_batch_timeout: "false",

  html5_enable_dai_single_video_ad: "false",
  html5_onesie: "false",
  html5_onesie_host_probing: "false",
  html5_onesie_media_bytes: "false",
  html5_onesie_player_config: "false",
  html5_onesie_player_config_webfe: "false",
  html5_onesie_server_initial_format_selection: "false",
  html5_onesie_wait_for_media_availability: "false",
  html5_skip_setVideoData: "false",
  html5_streaming_xhr: "false",
};

// @ts-ignore
const cfg = window.ytcfg;

if (!cfg) {
  console.warn("[Holodex+]", "disablePlayability: ytcfg is missing");
} else {
  const configs = cfg.get("WEB_PLAYER_CONTEXT_CONFIGS");
  let flags = configs?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER?.serializedExperimentFlags;
  if (flags) {
    Object.keys(overrides).forEach((key) => {
      const regex = new RegExp(`(?<=${key}=)[^&]+(?<!&)`);
      const val = overrides[key];
      if (flags.match(regex)) {
        flags = flags.replace(regex, val);
      } else {
        flags += `&${key}=${val}`;
      }
    });
    configs.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER.serializedExperimentFlags = flags;
    configs.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER.isEmbed = false;
    console.log("[Holodex+]", "Sucessfully set overrides");
  }
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
    // const ytLikeData = await getYtLikeData();
    // const { apiKey = DEFAULT_KEY } = ytLikeData || {};

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

    const url = YT_PLAYER_URL + DEFAULT_KEY;

    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    const res = await fetch(url, options);
    const mediaData = await res.json();
    console.log(mediaData);
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

export {};

