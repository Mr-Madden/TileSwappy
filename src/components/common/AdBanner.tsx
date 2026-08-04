import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// The AdSense publisher account is already approved and loaded (see the
// adsbygoogle script tag in public/index.html). AD_SLOT below is a real,
// responsive "TileSwappy Ads" Display ad unit created in that account's
// dashboard (Ads > By ad unit).
const AD_CLIENT = 'ca-pub-3568015124939970';
const AD_SLOT = '6606026083';

interface AdBannerProps {
  className?: string;
}

// A single reusable banner slot -- drop it anywhere in the game (currently
// just the home screen) without duplicating the adsbygoogle push logic.
export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) {
      return;
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script blocked/not yet loaded (ad blocker, offline dev
      // server, etc.) -- the slot just stays empty, nothing to recover.
    }
  }, []);

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', minHeight: 90 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
