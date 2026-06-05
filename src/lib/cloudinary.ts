export function getCloudinaryVideoPoster(
  videoUrl?: string | null,
  seconds: number = 3,
): string | null {
  if (!videoUrl) return null;
  try {
    const raw = videoUrl.trim();
    if (!raw) return null;
    const url = new URL(raw);
    if (!url.hostname.includes("res.cloudinary.com")) return null;
    const seek = Math.max(0, Math.floor(seconds));
    url.pathname = url.pathname.replace(
      "/video/upload/",
      `/video/upload/so_${seek},f_jpg,q_auto/`,
    );
    if (/\.(mp4|webm|mov|ogg)$/i.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\.(mp4|webm|mov|ogg)$/i, ".jpg");
    } else if (!/\.jpg$/i.test(url.pathname)) {
      url.pathname = `${url.pathname}.jpg`;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getCloudinaryIOSVideoSrc(videoUrl?: string | null): string | null {
  if (!videoUrl) return null;
  try {
    const raw = videoUrl.trim();
    if (!raw) return null;
    const url = new URL(raw);
    if (!url.hostname.includes("res.cloudinary.com")) return null;
    url.pathname = url.pathname.replace(
      "/video/upload/",
      "/video/upload/f_mp4,vc_h264,ac_aac/",
    );
    if (/\.(webm|mov|ogg)$/i.test(url.pathname)) {
      url.pathname = url.pathname.replace(/\.(webm|mov|ogg)$/i, ".mp4");
    } else if (!/\.mp4$/i.test(url.pathname)) {
      url.pathname = `${url.pathname}.mp4`;
    }
    return url.toString();
  } catch {
    return null;
  }
}
