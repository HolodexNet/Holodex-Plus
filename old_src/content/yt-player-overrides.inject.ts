import { Innertube, UniversalCache } from "youtubei.js";
import { ProtoframeDescriptor, ProtoframePubsub } from "protoframe";
// import type { Format } from "youtubei.js/dist/src/Innertube.d.ts";

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

// @ts-expect-error "ytcfg" is a YT global
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

interface YTFFormat extends Format {}

export const ytAudioDLProtocol: ProtoframeDescriptor<{
  fetchAudio: {
    body: { videoId?: string };
    response: { state: "ok" | "failed"; msg: string; format?: YTFFormat };
  };
  progress: {
    body: { percentage: number; total: number };
  };
  fetchAudioComplete: {
    body: { audio: Uint8Array; format: YTFFormat };
  };
}> = { type: "audio_dl" };

const manager = ProtoframePubsub.iframe(ytAudioDLProtocol);

manager.handleAsk("fetchAudio", async (body) => {
  if (!body.videoId) {
    console.error("[Holodex+] No video ID");
    return Promise.resolve({ state: "failed", msg: "No Video ID provided", format: undefined });
  }
  try {
    const innertube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: false,
      fetch(i, e) {
        return window.fetch(i, e);
      },
    });

    const info = await innertube.getInfo(body.videoId, "WEB");
    console.log(info);
    const format = info.chooseFormat({
      type: "audio", // audio, video or video+audio
      quality: "bestefficiency", // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
      format: "opus", // media container format
    });
    const totalBytes = format.content_length || -1;

    return await new Promise((resolve,) => {
      info
        .download({
          client: "WEB",
          type: "audio", // audio, video or video+audio
          quality: "bestefficiency", // best, bestefficiency, 144p, 240p, 480p, 720p and so on.
          format: "opus", // media container format
        })
        .then(
          async (rstream) => {
            resolve({ state: "ok", msg: "in progress...", format: format });
            const chunks: Uint8Array[] = [];
            let downloadedBytes = 0;

            const reader = rstream.getReader();
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const x = await reader.read();

              if (x.done) {
                break;
              }

              chunks.push(x.value);
              downloadedBytes += x.value.length;
              if (totalBytes < 0) {
                manager.tell("progress", { percentage: -1, total: downloadedBytes });
              } else {
                const progress = Math.round((downloadedBytes / totalBytes) * 100);
                manager.tell("progress", { percentage: progress * 0.95, total: totalBytes });
              }
            }
            const result = new Uint8Array(downloadedBytes);
            let offset = 0;

            for (const chunk of chunks) {
              result.set(chunk, offset);
              offset += chunk.length;
            }
            manager.tell("progress", { percentage: 100, total: totalBytes });
            manager.tell("fetchAudioComplete", { audio: result, format: format });
          },
          (reason) => {
            resolve({ state: "failed", msg: "Error occured: " + new String(reason || "???"), format: undefined });
          }
        );
    });
  } catch (e) {
    console.error(e);
    console.error("Failed to download from Youtube...?");
    return { state: "failed", msg: "Error occured: " + new String(e || "???"), format: undefined };
  }
});

export {};

