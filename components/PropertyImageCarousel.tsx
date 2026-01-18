"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PropertyImageCarouselProps = {
  images: string[];
};

export default function PropertyImageCarousel({ images }: PropertyImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初期表示時に全画像をプリロード
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // 現在の画像と前後の画像を優先的にキャッシュ
  useEffect(() => {
    const preloadImages = [currentIndex];
    if (images.length > 1) {
      const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      preloadImages.push(prevIndex, nextIndex);
    }

    preloadImages.forEach((index) => {
      const img = new Image();
      img.src = images[index];
    });
  }, [currentIndex, images]);

  // 自動スクロール機能（4秒おき）
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, isPaused]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full max-h-[500px] bg-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400">
        No images available
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsPaused(true);
    // 3秒後に自動スクロールを再開
    setTimeout(() => setIsPaused(false), 3000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsPaused(true);
    // 3秒後に自動スクロールを再開
    setTimeout(() => setIsPaused(false), 3000);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    // 3秒後に自動スクロールを再開
    setTimeout(() => setIsPaused(false), 3000);
  };

  return (
    <div 
      className="relative w-full max-h-[500px] rounded-2xl overflow-hidden bg-zinc-100 mb-6 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image */}
      <div className="relative w-full h-full max-h-[500px] overflow-hidden">
        <img
          src={images[currentIndex]}
          alt={`Property image ${currentIndex + 1}`}
          className="w-full h-full object-cover max-h-[500px] transition-opacity duration-500"
          loading="eager"
          key={currentIndex}
        />
      </div>
    
      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
