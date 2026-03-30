/**
 * Video Effects Utilities for Call Modal
 * Provides background blur, virtual backgrounds, and video filters
 */

export class VideoEffects {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoElement: HTMLVideoElement;
  private animationFrameId: number | null = null;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = 640;
    this.canvas.height = 480;
  }

  /**
   * Apply background blur effect
   */
  async applyBackgroundBlur(intensity: 'light' | 'heavy' = 'light'): Promise<MediaStream> {
    const blurAmount = intensity === 'light' ? 10 : 20;
    
    const processFrame = () => {
      this.ctx.filter = `blur(${blurAmount}px)`;
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.filter = 'none';
      
      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
    return this.canvas.captureStream(30);
  }

  /**
   * Apply virtual background
   */
  async applyVirtualBackground(backgroundImage: string): Promise<MediaStream> {
    const img = new Image();
    img.src = backgroundImage;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const processFrame = () => {
      // Draw background
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      
      // In a real implementation, you would use body segmentation here
      // For now, just overlay the video
      this.ctx.globalAlpha = 0.8;
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalAlpha = 1;
      
      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
    return this.canvas.captureStream(30);
  }

  /**
   * Apply video filter
   */
  async applyFilter(filter: 'none' | 'grayscale' | 'sepia' | 'brightness' | 'contrast'): Promise<MediaStream> {
    const filters = {
      none: 'none',
      grayscale: 'grayscale(100%)',
      sepia: 'sepia(100%)',
      brightness: 'brightness(120%)',
      contrast: 'contrast(120%)',
    };

    const processFrame = () => {
      this.ctx.filter = filters[filter];
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.filter = 'none';
      
      this.animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();
    return this.canvas.captureStream(30);
  }

  /**
   * Stop all effects
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get canvas for external use
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

/**
 * Simplified background blur using CSS blur filter
 * For browsers that don't support advanced canvas operations
 */
export function applySimpleBlur(videoElement: HTMLVideoElement, intensity: number): void {
  videoElement.style.filter = `blur(${intensity}px)`;
}

/**
 * Remove blur effect
 */
export function removeBlur(videoElement: HTMLVideoElement): void {
  videoElement.style.filter = 'none';
}
