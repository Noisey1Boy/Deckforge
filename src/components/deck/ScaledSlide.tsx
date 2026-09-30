'use client';

import { useEffect, useRef, useState } from 'react';
import { SlideView } from './SlideView';
import type { Slide, ThemeManifest } from '@/lib/deck/types';
import { cn } from '@/lib/utils';

/**
 * Renders a 1280x720 slide scaled to fit its container width.
 * The wrapper keeps a 16:9 aspect ratio; the inner stage is transform-scaled.
 */
export function ScaledSlide({
  slide,
  theme,
  deckTitle,
  index,
  pageCount,
  showFooter,
  className,
  onClick,
  interactive = false,
}: {
  slide: Slide;
  theme: ThemeManifest;
  deckTitle?: string;
  index?: number;
  pageCount?: number;
  showFooter?: boolean;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1280);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full overflow-hidden bg-neutral-200 dark:bg-neutral-800',
        className
      )}
      style={{ aspectRatio: '16 / 9' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {scale > 0 ? (
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          className={interactive ? 'pointer-events-auto' : 'pointer-events-none select-none'}
          aria-hidden={!interactive || undefined}
        >
          <SlideView
            slide={slide}
            theme={theme}
            deckTitle={deckTitle}
            index={index}
            pageCount={pageCount}
            showFooter={showFooter}
          />
        </div>
      ) : null}
    </div>
  );
}
