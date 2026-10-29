'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function ImageSlider({ images, alt }) {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  const go = useCallback(
    (i) => setIndex(((i % images.length) + images.length) % images.length),
    [images.length]
  );

  // Auto-advance every 3.5s; pause on touch/hover interaction.
  useEffect(() => {
    timer.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer.current);
  }, [images.length]);

  const pause = () => clearInterval(timer.current);

  return (
    <div className="slider" onMouseEnter={pause} onTouchStart={pause}>
      <div
        className="slider-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src) => (
          // Plain <img> keeps the demo lean (local files in /public/images).
          <img key={src} src={src} alt={alt} className="slider-img" />
        ))}
      </div>
      <button
        type="button"
        className="slider-arrow left"
        aria-label="আগের ছবি"
        onClick={() => go(index - 1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="slider-arrow right"
        aria-label="পরের ছবি"
        onClick={() => go(index + 1)}
      >
        ›
      </button>
      <div className="slider-dots">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`ছবি ${i + 1}`}
            className={i === index ? 'dot active' : 'dot'}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
