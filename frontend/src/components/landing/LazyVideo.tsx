"use client";
/* Autoplay-in-view demo video. Muted + loop + playsInline so browsers allow
   autoplay; an IntersectionObserver plays it when it scrolls into view and
   pauses it when it leaves. Recreated from the original feature-section.tsx. */
import { useEffect, useRef, useState } from "react";

export default function LazyVideo({
  src,
  poster,
  alt,
}: {
  src: string;
  poster?: string;
  alt: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            el.play().catch(() => {});
          } else if (!el.paused) {
            el.pause();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      className="block w-full h-auto rounded-lg"
      poster={poster}
      aria-label={alt}
      muted
      loop
      playsInline
      preload={inView ? "auto" : "metadata"}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
