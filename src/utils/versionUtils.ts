import { getVersion } from "@tauri-apps/api/app";

let cachedVersion: string | null = null;

export async function getAppVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    cachedVersion = await getVersion();
    return cachedVersion;
  } catch (error) {
    console.error("Failed to get app version:", error);
    return "0.0.0";
  }
}
