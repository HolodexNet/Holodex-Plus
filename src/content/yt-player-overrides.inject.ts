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

export {};
