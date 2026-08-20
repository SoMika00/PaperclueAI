"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";

import { ArrowRight, Play, Loader2, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

import Image from "next/image";
import mindMapImage from "../../../public/img/mindmap.png"; // Adjust the path as necessary
import citationImage from "../../../public/img/citation_checker.png"; // Adjust the path as necessary

interface FeatureSectionProps {
  title: string;
  description: string;
  features: Array<{
    title: string;
    description: string;
    icon?: React.ReactNode;
  }>;
  ctaText: string;
  ctaLink?: string;
  /* Which demo video/poster to show. Originally inferred from ctaLink (which
     pointed at the real /proofreader or /mind-map feature route); now that
     both CTAs point at /login (those routes don't exist pre-login in this
     build), that inference always resolved to "mindMap". Pass this
     explicitly instead so the Research Refiner section keeps its own demo. */
  videoKey?: "proofreader" | "mindMap";
}

// Video Configuration - Choose your hosting approach
const VIDEO_CONFIG = {
  // Option 1: Cloud Hosting (RECOMMENDED for production)
  // Replace with your cloud video URLs
  cloudUrls: {
    proofreader: "https://res.cloudinary.com/di98mpcja/video/upload/v1756089401/proofreader_vrusej.mp4", // Cloudinary, S3, etc.
    mindMap: "https://res.cloudinary.com/di98mpcja/video/upload/v1756089454/mind_map_qzbdeb.mp4"
  },
  
  // Option 2: Local/Netlify hosting (for development or small videos)
  localUrls: {
    proofreader: "/video/proofreader.mp4",
    mindMap: "/video/mind_map.mp4"
  },
  
  // Set to 'cloud' for production, 'local' for development
  mode: 'cloud' as 'cloud' | 'local'
};

// Lazy Video Component with Auto-play
function LazyVideo({ videoSrc, posterSrc, alt }: { videoSrc: string; posterSrc: any; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for auto-play
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for auto-play when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Auto-play when in view (muted for browser compatibility)
            if (isLoaded && videoRef.current) {
              videoRef.current.play().catch(() => {
                // Auto-play failed, show play button
                setIsPlaying(false);
              });
            }
          } else {
            // Pause when out of view
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoaded]);

  const handlePlayClick = () => {
    if (!isLoaded) {
      setIsLoading(true);
      setIsLoaded(true);
    }
    
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Restart video when it ends (for demo purposes)
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
    // Auto-play when loaded and in view
    if (isInView && videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-video bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden cursor-pointer group"
      onClick={handlePlayClick}
    >
      {/* Poster Image */}
      {/* {!isPlaying && !isLoaded && (
        <div className="absolute inset-0">
          <Image
            src={posterSrc}
            alt={alt}
            fill
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        </div>
      )} */}

      {/* Play/Pause Button Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-full p-4 shadow-lg group-hover:scale-110 transition-transform">
            {isLoading ? (
              <Loader2 className="h-8 w-8 text-slate-600 dark:text-slate-400 animate-spin" />
            ) : (
              <Play className="h-8 w-8 text-slate-600 dark:text-slate-400 ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={false}
        onEnded={handleVideoEnded}
        onLoadedData={handleVideoLoaded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto" // Options: "none", "metadata", "auto"
        muted={isMuted}
        loop
        playsInline
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Video Controls Overlay */}
      {isLoaded && isPlaying && (
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleMute}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            {isMuted ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.5l3.883-3.794a1 1 0 011.617.794zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.5l3.883-3.794a1 1 0 011.617.794zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {/* {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )} */}
    </div>
  );
}

export function FeatureSection({
  title,
  description,
  features,
  ctaText,
  ctaLink = "#",
  videoKey,
}: FeatureSectionProps) {
  const { t } = useTranslation();

  // Which demo to show: explicit videoKey prop, falling back to the old
  // ctaLink-based inference for any caller that still passes a real route.
  const resolvedVideoKey: "proofreader" | "mindMap" =
    videoKey ?? (ctaLink === "/proofreader" ? "proofreader" : "mindMap");

  const getVideoSrc = () => {
    return VIDEO_CONFIG.mode === 'cloud'
      ? VIDEO_CONFIG.cloudUrls[resolvedVideoKey]
      : VIDEO_CONFIG.localUrls[resolvedVideoKey];
  };

  const videoSrc = getVideoSrc();
  const posterSrc = resolvedVideoKey === "proofreader" ? citationImage : mindMapImage;
  const videoAlt = resolvedVideoKey === "proofreader" ? "Proofreader Demo" : "Mind Map Demo";

  return (
    <div className="mb-24">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-4 dark:text-white">{title}</h3>
        <p className="text-slate-700 dark:text-slate-300 max-w-3xl mx-auto mb-6 text-lg">
          {description}
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="p-6 h-full border-0 bg-gradient-to-br bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 hover:dark:bg-blue-400 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex flex-col h-full">
              <h4 className="text-lg font-semibold mb-3 text-white dark:text-blue-900">
                {feature.title}
              </h4>
              <p className="text-sm text-blue-100 flex-grow leading-relaxed dark:text-blue-800">
                {feature.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Demo Video */}
      <div className="bg-slate-100/80 dark:bg-slate-800/60 rounded-lg overflow-hidden p-4 shadow-md backdrop-blur-sm mb-12 max-w-4xl mx-auto">
        <LazyVideo 
          videoSrc={videoSrc}
          posterSrc={posterSrc}
          alt={videoAlt}
        />
      </div>
      
      <div className="text-center">
        <Button
          className="bg-gradient-to-r from-theme_primary to-theme_secondary hover:from-blue-700 hover:to-violet-700"
          asChild
        >
          <a href={ctaLink}>
            {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
