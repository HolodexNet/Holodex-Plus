import { inject, sha1 } from "../util";

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
const id = window.location.pathname.split("/").slice(-1)[0];

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

function like(videoId: string) {
  return new Promise<Response>((resolve, reject) => {
    let req = new XMLHttpRequest();
    req.open("GET", `https://www.youtube.com/watch?v=${videoId}`);
    req.send();
    req.onload = async () => {
      console.log(req.responseText);
      const apiKey = req.responseText.match(/"INNERTUBE_API_KEY":"(.*?)"/)?.[1];
      const context = JSON.parse(
        (req.responseText.match(/\(\{"INNERTUBE_CONTEXT":([\w\W]*?)\}\)/) ||
          req.responseText.match(/"INNERTUBE_CONTEXT":([\w\W]*?\}),"INNERTUBE/))?.[1] || "{}"
      );
      console.log(context);
      const ytClientName = req.responseText.match(/"INNERTUBE_CONTEXT_CLIENT_NAME":(\d+),/)?.[1];
      const ytClientVersion = req.responseText.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"(.*?)"/)?.[1];
      const pageId = req.responseText.match(/"DELEGATED_SESSION_ID":"(.*?)"/)?.[1];
      const likeParams = req.responseText.match(/"likeParams":"(.*?)"/)?.[1];
      const likeVideoData = {
        context,
        target: { videoId },
        params: likeParams,
      };

      // const sidStart = document.cookie.indexOf("__Secure-3PAPISID=") + "__Secure-3PAPISID=".length;
      // const endpoint = document.cookie.substring(sidStart).indexOf(";");
      // const sidEnd = sidStart + endpoint < 0 ? 10000: endpoint;
      // const PAPISID = document.cookie.substring(sidStart, sidEnd);

      const PAPISID = document.cookie.match(/3PAPISID=([^;]*);?.*$/)?.[1];
      const nowTime = Math.floor(Date.now() / 1000);
      // console.log("[HOLODEX+] PAPISID", PAPISID, )
      // console.log("[HOLODEX+] Cookie", document.cookie, )
      // console.log("[Holodex+] data", context, "out", likeVideoData);

      // TODO: get the low-hanging fruit: sec-fetch-mode, etc.
      // TODO: adSignalsInfo
      // TODO: clickTrackingParams
      // TODO: missing fields in 'client'

      fetch(`https://www.youtube.com/youtubei/v1/like/like?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-AuthUser": "0",
          "X-Goog-Visitor-Id": context.client.visitorData,
          "X-Goog-PageId": pageId!,
          "X-Youtube-Client-Name": ytClientName!,
          "X-Youtube-Client-Version": ytClientVersion!,
          "X-Origin": "https://www.youtube.com",
          "SEC-CH-UA-ARCH": "x86",
          "sec-ch-ua-platform-version": "10.0.0",
          "sec-ch-ua-full-version": "93.0.4577.82",
          Authorization: `SAPISIDHASH ${nowTime}_${await sha1(`${nowTime} ${PAPISID} https://www.youtube.com`)}`,
        },
        body: JSON.stringify(likeVideoData),
      }).then(async (res) => {
        const text = await res.text();
        if (
          res.status === 200 &&
          (text.includes("Added to Liked videos") || text.includes("Removed from Liked videos"))
        ) {
          resolve(res);
        } else {
          reject(res);
        }
      });
    };
  });
}

if (window.confirm("Like video?")) {
  like(id).then(() => window.alert("Liked!"));
}

export {};
