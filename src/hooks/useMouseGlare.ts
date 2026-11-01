import { useRef, useEffect, useCallback, type RefObject } from 'react';

export interface UseMouseGlareOptions {
  /** Custom max opacity for specular glare (defaults to 1) */
  maxOpacity?: number;
  /** Radius of the glare effect in pixels (defaults to 220) */
  radius?: number;
  /** Whether to disable glare on touch devices (defaults to true) */
  disableOnTouch?: boolean;
}

/**
 * Hook to apply liquid glass cursor glare refraction to an HTML element.
 * Updates CSS variables:
 *  - `--mouse-x`: X coordinate relative to card bounding box
 *  - `--mouse-y`: Y coordinate relative to card bounding box
 *  - `--glare-opacity`: 0 when pointer is outside, up to maxOpacity on hover
 */
export function useMouseGlare<T extends HTMLElement = HTMLDivElement>(
  externalRef?: RefObject<T | null>,
  options: UseMouseGlareOptions = {}
) {
  const internalRef = useRef<T | null>(null);
  const targetRef = externalRef || internalRef;
  const rafId = useRef<number | null>(null);

  const { maxOpacity = 1, disableOnTouch = true } = options;

  const updateCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      const el = targetRef.current;
      if (!el) return;

      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
        el.style.setProperty('--glare-opacity', `${maxOpacity}`);
      });
    },
    [targetRef, maxOpacity]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent | MouseEvent) => {
      if (disableOnTouch && 'pointerType' in e && e.pointerType === 'touch') {
        return;
      }
      updateCoordinates(e.clientX, e.clientY);
    },
    [disableOnTouch, updateCoordinates]
  );

  const handlePointerEnter = useCallback(
    (e: PointerEvent | MouseEvent) => {
      if (disableOnTouch && 'pointerType' in e && e.pointerType === 'touch') {
        return;
      }
      updateCoordinates(e.clientX, e.clientY);
    },
    [disableOnTouch, updateCoordinates]
  );

  const handlePointerLeave = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    el.style.setProperty('--glare-opacity', '0');
  }, [targetRef]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    // Set initial defaults
    el.style.setProperty('--mouse-x', '50%');
    el.style.setProperty('--mouse-y', '50%');
    el.style.setProperty('--glare-opacity', '0');

    el.addEventListener('pointerenter', handlePointerEnter as EventListener, { passive: true });
    el.addEventListener('pointermove', handlePointerMove as EventListener, { passive: true });
    el.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      el.removeEventListener('pointerenter', handlePointerEnter as EventListener);
      el.removeEventListener('pointermove', handlePointerMove as EventListener);
      el.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [targetRef, handlePointerEnter, handlePointerMove, handlePointerLeave]);

  // Also return inline handlers in case user prefers passing them directly via JSX props
  return {
    ref: targetRef,
    onPointerEnter: (e: React.PointerEvent<T>) => {
      if (disableOnTouch && e.pointerType === 'touch') return;
      updateCoordinates(e.clientX, e.clientY);
    },
    onPointerMove: (e: React.PointerEvent<T>) => {
      if (disableOnTouch && e.pointerType === 'touch') return;
      updateCoordinates(e.clientX, e.clientY);
    },
    onPointerLeave: () => {
      handlePointerLeave();
    }
  };
}

/**
 * Global delegate glare hook:
 * Automatically applies cursor glare to any `.liquid-glass` element under the cursor across the container.
 */
export function useGlobalMouseGlare(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let activeEl: HTMLElement | null = null;
    let rafId: number | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;

      const target = (e.target as HTMLElement)?.closest?.('.liquid-glass') as HTMLElement | null;

      if (target !== activeEl) {
        if (activeEl) {
          activeEl.style.setProperty('--glare-opacity', '0');
        }
        activeEl = target;
      }

      if (activeEl) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          if (!activeEl) return;
          const rect = activeEl.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          activeEl.style.setProperty('--mouse-x', `${x}px`);
          activeEl.style.setProperty('--mouse-y', `${y}px`);
          activeEl.style.setProperty('--glare-opacity', '1');
        });
      }
    };

    const onPointerLeave = () => {
      if (activeEl) {
        activeEl.style.setProperty('--glare-opacity', '0');
        activeEl = null;
      }
      if (rafId !== null) cancelAnimationFrame(rafId);
    };

    const targetNode = containerRef?.current || window;
    targetNode.addEventListener('pointermove', onPointerMove as EventListener, { passive: true });
    targetNode.addEventListener('pointerleave', onPointerLeave as EventListener, { passive: true });

    return () => {
      targetNode.removeEventListener('pointermove', onPointerMove as EventListener);
      targetNode.removeEventListener('pointerleave', onPointerLeave as EventListener);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef]);
}

export default useMouseGlare;
