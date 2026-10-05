'use client';

import { useState, type ImgHTMLAttributes } from 'react';

export default function SafeImage({ alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="image-fallback" role="img" aria-label={alt}><span>📷 {alt || 'Image unavailable'}</span></div>;
  return <img {...props} alt={alt} onError={() => setFailed(true)} />;
}
