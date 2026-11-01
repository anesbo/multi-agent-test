// Mock window / browser environment globals for testing
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Canvas mock for JSDOM
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (this: any, contextId: string) {
    if (contextId === '2d') {
      return {
        canvas: this,
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        resetTransform: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      } as any;
    }
    return null;
  } as any;
}

// ResizeObserver mock
if (typeof window !== 'undefined') {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver || MockResizeObserver;

  // RequestAnimationFrame mock
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
  window.cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id));

  // Geolocation mock
  const mockGeolocation = {
    getCurrentPosition: (success: any) => {
      success({
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
        },
      });
    },
    watchPosition: () => 1,
    clearWatch: () => {},
  };
  (navigator as any).geolocation = (navigator as any).geolocation || mockGeolocation;
}
