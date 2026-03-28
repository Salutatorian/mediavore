import type { AppSettings } from "./App";

export type ClientProfile =
  | "ios"
  | "ipados"
  | "macos"
  | "windows"
  | "android"
  | "linux"
  | "unknown";

/** Detect OS / device for sane default codecs (H.264 + MP4-friendly). */
export function detectClientProfile(): ClientProfile {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouch = navigator.maxTouchPoints ?? 0;

  if (/iPhone/i.test(ua)) return "ios";
  if (/iPad/i.test(ua)) return "ipados";
  // iPadOS 13+ desktop Safari often reports MacIntel + touch
  if (
    (platform === "MacIntel" || platform === "iPad") &&
    maxTouch > 1 &&
    !/iPhone/i.test(ua)
  ) {
    return "ipados";
  }
  if (/Mac/i.test(platform) || /Mac OS X/i.test(ua)) return "macos";
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return "windows";
  if (/Android/i.test(ua)) return "android";
  if (/Linux/i.test(platform)) return "linux";
  return "unknown";
}

/** Defaults tuned for each platform’s built-in players (Files, Photos, QuickTime, Movies & TV). */
export function getDefaultSettingsForProfile(
  profile: ClientProfile,
): AppSettings {
  const base: AppSettings = {
    videoQuality: "1080p",
    videoCodec: "h264",
    audioFormat: "original",
    audioBitrate: 192,
  };

  switch (profile) {
    case "ios":
    case "ipados":
      return { ...base, videoQuality: "1080p", videoCodec: "h264" };
    case "macos":
      return { ...base, videoQuality: "1080p", videoCodec: "h264" };
    case "windows":
      return { ...base, videoQuality: "1080p", videoCodec: "h264" };
    case "android":
      return { ...base, videoQuality: "1080p", videoCodec: "h264" };
    case "linux":
      return { ...base, videoQuality: "1080p", videoCodec: "h264" };
    default:
      return base;
  }
}

export function clientProfileLabel(profile: ClientProfile): string {
  switch (profile) {
    case "ios":
      return "iPhone";
    case "ipados":
      return "iPad";
    case "macos":
      return "Mac";
    case "windows":
      return "Windows";
    case "android":
      return "Android";
    case "linux":
      return "Linux";
    default:
      return "This device";
  }
}
