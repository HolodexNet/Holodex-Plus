import { ClientType, Innertube, UniversalCache } from "youtubei.js";
import { ProtoframeDescriptor, ProtoframePubsub } from "protoframe";
import type Format from "youtubei.js/dist/src/parser/classes/misc/Format";

console.log("[Holodex+]", "Initializing");

// // List of flags and desired values
// const overrides: Record<string, string> = {
//   autoplay_time: "8000",
//   autoplay_time_for_music_content: "3000",
//   csi_on_gel: "true",
//   disable_features_for_supex: "true",
//   disable_legacy_desktop_remote_queue: "true",
//   enable_client_sli_logging: "true",
//   enable_gel_log_commands: "true",
//   offline_error_handling: "true",
//   player_doubletap_to_seek: "true",
//   preskip_button_style_ads_backend: "countdown_next_to_thumbnail",
//   web_deprecate_service_ajax_map_dependency: "true",
//   web_forward_command_on_pbj: "true",
//   should_clear_video_data_on_player_cued_unstarted: "true",
//   ytidb_fetch_datasync_ids_for_data_cleanup: "true",
//   web_player_nitrate_promo_tooltip: "true",
//   web_player_move_autonav_toggle: "true",

//   enable_cookie_reissue_iframe: "false",
//   shorten_initial_gel_batch_timeout: "false",

//   html5_enable_dai_single_video_ad: "false",
//   html5_onesie: "false",
//   html5_onesie_host_probing: "false",
//   html5_onesie_media_bytes: "false",
//   html5_onesie_player_config: "false",
//   html5_onesie_player_config_webfe: "false",
//   html5_onesie_server_initial_format_selection: "false",
//   html5_onesie_wait_for_media_availability: "false",
//   html5_skip_setVideoData: "false",
//   html5_streaming_xhr: "false",
// };

// // @ts-expect-error "ytcfg" is a YT global
// const cfg = window.ytcfg;

// if (!cfg) {
//   console.warn("[Holodex+]", "disablePlayability: ytcfg is missing");
// } else {
//   console.log(
//     "[Holodex+]",
//     "Configuring overrides, hopefully this is before the player loads", 
//     // @ts-expect-error "yt" is a YT global
//     Object.keys(window.yt.player)
//   );
//   const configs = cfg.get("WEB_PLAYER_CONTEXT_CONFIGS");
//   let flags =
//     configs?.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER
//       ?.serializedExperimentFlags;
//   if (flags) {
//     Object.keys(overrides).forEach((key) => {
//       const regex = new RegExp(`(?<=${key}=)[^&]+(?<!&)`);
//       const val = overrides[key];
//       if (flags.match(regex)) {
//         flags = flags.replace(regex, val);
//       } else {
//         flags += `&${key}=${val}`;
//       }
//     });
//     configs.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER.serializedExperimentFlags =
//       flags;
//     configs.WEB_PLAYER_CONTEXT_CONFIG_ID_EMBEDDED_PLAYER.isEmbed = false;
//     console.log("[Holodex+]", "Sucessfully set overrides");
//   }
// }

interface YTFFormat extends Format {}

const ytAudioDLProtocol: ProtoframeDescriptor<{
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

function b64ToU8(base64) {
  const str = atob(base64);
  const len = str.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

function u8ToB64(u8, urlSafe = false) {
  const buf = String.fromCharCode(...u8);
  const base64 = btoa(buf);
  return urlSafe ? base64.replace(/\//g, "_").replace(/\+/g, "-") : base64;
}

function computeHash(input, start = 0, end = input.length) {
  let hash = 0;
  for (let i = start; i < end; i++) {
    const code = typeof input === "string" ? input.charCodeAt(i) : input[i];
    hash = (Math.imul(31, hash) + code) | 0;
  }
  return hash;
}

function generateKeyPair(keyMaterial) {
  const mid = keyMaterial.length >> 1;
  return [computeHash(keyMaterial, 0, mid), computeHash(keyMaterial, mid)];
}

function transformData(data, keyMaterial) {
  const [key1, key2] = generateKeyPair(keyMaterial);
  const data32 = new Uint32Array(data.buffer);
  const firstWord = data32[0];

  for (let i = 1; i < data32.length; i += 2) {
    let a = firstWord;
    let b = i;
    let c = key1;
    let d = key2;

    for (let round = 0; round < 22; round++) {
      b = ((b >>> 8) | (b << 24)) + a;
      b ^= c + 38293;
      a = ((a << 3) | (a >>> 29)) ^ b;

      d = ((d >>> 8) | (d << 24)) + c;
      d ^= round + 38293;
      c = ((c << 3) | (c >>> 29)) ^ d;
    }

    data32[i] ^= a;
    if (i + 1 < data32.length) {
      data32[i + 1] ^= b;
    }
  }
}

function decodeCachedPoToken(identifier, encodedPoToken) {
  const data = b64ToU8(encodedPoToken);
  transformData(data, identifier);

  let index = 4;
  while (index < 7 && data[index] === 0) index++;

  // Not sure if these ever change, they're hardcoded in the original code. It's obviously for some kind of validation.
  const VALIDATION_BYTES = [196, 200, 224, 18];

  for (let i = 0; i < VALIDATION_BYTES.length; i++) {
    if (data[index++] !== VALIDATION_BYTES[i])
      throw new Error("Validation failed");
  }

  const timestamp = new DataView(data.buffer).getUint32(index);
  index += 4;

  const poToken = u8ToB64(new Uint8Array(data.buffer, index), true);

  return {
    expires: new Date(timestamp * 1000),
    poToken,
  };
}


const manager = ProtoframePubsub.iframe(ytAudioDLProtocol);

manager.handleAsk(
  "fetchAudio",
  async (
    body
  ): Promise<{ state: "ok" | "failed"; msg: string; format?: YTFFormat }> => {
    if (!body.videoId) {
      console.error("[Holodex+] No video ID");
      return Promise.resolve({
        state: "failed",
        msg: "No Video ID provided",
        format: undefined,
      });
    }
    try {
      // access sessionstorage
      const visitorData = // @ts-expect-error "yt" is a YT global
        window.yt.config_["DATASYNC_ID"] || window.yt.config_["VISITOR_DATA"];
      const potKey = window.sessionStorage.getItem("iU5q-!O9@$");
      console.log(potKey)
      const potValue = window.sessionStorage.getItem((potKey ?? "_").split(",")[1]);

      // The first value should be either the user's visitor data or their datasync id (if they're logged in).
      console.log(visitorData, potValue);
      const potToken = decodeCachedPoToken(visitorData, potValue);
      console.log(potToken);

      const innertube = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: false,
        visitor_data: visitorData,
        po_token: potToken.poToken,
        client_type: ClientType.WEB_EMBEDDED,
        fetch: async (url, options) => {
          console.log(`Fetching: ${url}, options: ${JSON.stringify(options)}`);
          let response = await window.fetch(url, {
            ...options,
            // redirect: "manual",
          });

          // Handle manual redirect
          if (response.status === 301 || response.status === 302) {
            const redirectedUrl = response.headers.get("Location");
            if (redirectedUrl) {
              console.log(`Redirected to: ${redirectedUrl}`);
              // Make a new request to the redirected URL, including headers if needed
              response = await window.fetch(redirectedUrl, {
                ...options,
                headers: {
                  ...options?.headers,
                  // Set any additional headers needed for the redirected request
                  Origin: location.origin,
                },
              });
            }
          }

          return response;
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

      return await new Promise((resolve) => {
        info
          .download({
            // client: "WEB",
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
                  manager.tell("progress", {
                    percentage: -1,
                    total: downloadedBytes,
                  });
                } else {
                  const progress = Math.round(
                    (downloadedBytes / totalBytes) * 100
                  );
                  manager.tell("progress", {
                    percentage: progress * 0.95,
                    total: totalBytes,
                  });
                }
              }
              const result = new Uint8Array(downloadedBytes);
              let offset = 0;

              for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
              }
              manager.tell("progress", { percentage: 100, total: totalBytes });
              manager.tell("fetchAudioComplete", {
                audio: result,
                format: format,
              });
            },
            (reason) => {
              resolve({
                state: "failed",
                msg: "Error occured: " + new String(reason || "???"),
                format: undefined,
              });
            }
          );
      });
    } catch (e) {
      console.error(e);
      console.error("Failed to download from Youtube...?");
      return {
        state: "failed",
        msg: "Error occured: " + new String(e || "???"),
        format: undefined,
      };
    }
  }
);