import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export function LightboxModal({ isOpen, onClose, images, activeIndex, setActiveIndex }) {
  if (!isOpen || !images || images.length === 0) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose, setActiveIndex]);

  const currentImg = images[activeIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between text-white z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-brand-muted">
            {activeIndex + 1} / {images.length}
          </span>
          {currentImg.category && (
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs font-mono text-brand-amber uppercase">
              {currentImg.category}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close Lightbox (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Stage with Nav Arrows */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
        <button
          onClick={() => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)}
          className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all backdrop-blur-md"
          title="Previous Image (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <img
          src={currentImg.url}
          alt={`Photo ${activeIndex + 1}`}
          className="max-h-[78vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all duration-300"
        />

        <button
          onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
          className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all backdrop-blur-md"
          title="Next Image (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
              activeIndex === idx
                ? 'border-brand-amber scale-105 shadow-glow-amber'
                : 'border-white/20 opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img.url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

