// Thin seam between the app's reward-granting logic (hint currency, etc.)
// and whatever ad network actually serves the video. Kept as one function
// so callers never touch a vendor SDK directly -- swapping networks later
// is a one-file change.
//
// TODO(monetization): this is a MOCK. There is no real ad network wired up
// yet -- Google's AdSense display tag (already loaded in public/index.html
// for the static marketing pages) does not serve rewarded video; that
// needs a separate account with a network that supports it for the open
// web (e.g. Google Ad Manager, or a rewarded-specific mediation SDK).
// Once you have real credentials:
//   1. Load that network's SDK script (in public/index.html, same pattern
//      as the existing adsbygoogle script tag).
//   2. Replace the body of showRewardedAd below with the real "request an
//      ad, show it, resolve based on whether the viewer earned the
//      reward" call from that SDK's docs.
// Everything upstream of this file (the hint currency, the UI states)
// already expects exactly this Promise<boolean> contract, so nothing else
// needs to change when the mock is swapped out.
export async function showRewardedAd(): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return true;
}
