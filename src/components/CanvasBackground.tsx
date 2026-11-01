import React, { useEffect, useRef } from 'react';
import type { ShowcaseMode } from '../types/weather';

export interface CanvasBackgroundProps {
  weatherCode?: number;
  isDay?: boolean;
  showcaseMode?: ShowcaseMode;
  className?: string;
}

type WeatherScene = 'sunny' | 'night' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow' | 'cloudy' | 'fog';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
  alpha: number;
  layer: number;
}

interface SplashRipple {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface SplashDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  radius: number;
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  alpha: number;
  swayFreq: number;
  swayAmp: number;
  swayPhase: number;
  drift: number;
  isBokeh: boolean;
}

interface CloudLobe {
  relX: number;
  relY: number;
  radius: number;
  alpha: number;
}

interface CloudMass {
  x: number;
  y: number;
  speed: number;
  scale: number;
  alpha: number;
  lobes: CloudLobe[];
}

interface LightningBoltNode {
  x: number;
  y: number;
}

interface LightningBranch {
  nodes: LightningBoltNode[];
  width: number;
  alpha: number;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({
  weatherCode = 0,
  isDay = true,
  showcaseMode = 'live',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine active weather scene
  const determineScene = (): WeatherScene => {
    if (showcaseMode && showcaseMode !== 'live') {
      switch (showcaseMode) {
        case 'sunny':
          return 'sunny';
        case 'night':
          return 'night';
        case 'rain':
          return 'rain';
        case 'thunderstorm':
          return 'thunderstorm';
        case 'snow':
          return 'snow';
        default:
          break;
      }
    }

    // Live mode mapping based on Open-Meteo weatherCode and isDay
    if ([95, 96, 99].includes(weatherCode)) return 'thunderstorm';
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return 'snow';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return 'rain';
    if ([51, 53, 55, 56, 57].includes(weatherCode)) return 'drizzle';
    if ([45, 48].includes(weatherCode)) return 'fog';
    if ([2, 3].includes(weatherCode)) return 'cloudy';
    if (weatherCode === 0 || weatherCode === 1) {
      return isDay ? 'sunny' : 'night';
    }

    return isDay ? 'sunny' : 'night';
  };

  const currentScene = determineScene();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastTime = performance.now();

    // Scene animation states
    let sunRotation = 0;
    let lensFlareRotation = 0;
    let shootingStarCooldown = 4000;
    let nextLightningTime = 2500 + Math.random() * 4000;
    let lightningState: {
      active: boolean;
      timer: number;
      flashAlpha: number;
      branches: LightningBranch[];
    } = {
      active: false,
      timer: 0,
      flashAlpha: 0,
      branches: []
    };

    // Cached element boundaries for raindrop splash collisions
    let cardBounds: { left: number; right: number; top: number }[] = [];
    let lastCardQueryTime = 0;

    const updateCardBounds = () => {
      const cards = document.querySelectorAll('.liquid-glass');
      cardBounds = Array.from(cards).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top
        };
      });
    };

    // Particles collections
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let raindrops: Raindrop[] = [];
    let ripples: SplashRipple[] = [];
    let splashDrops: SplashDrop[] = [];
    let snowflakes: Snowflake[] = [];
    let clouds: CloudMass[] = [];

    // Helper: Initialize Stars
    const initStars = (w: number, h: number) => {
      const count = Math.min(220, Math.floor((w * h) / 7000));
      stars = [];
      const colors = ['#ffffff', '#f0f5ff', '#dbeafe', '#e0e7ff', '#fffbeb'];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.85,
          radius: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.6 + 0.25,
          twinkleSpeed: Math.random() * 2 + 1,
          twinklePhase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    // Helper: Initialize Raindrops
    const initRaindrops = (w: number, h: number, isStorm: boolean, isDrizzle: boolean) => {
      const count = isStorm ? 360 : isDrizzle ? 120 : 260;
      raindrops = [];
      for (let i = 0; i < count; i++) {
        const layer = Math.random() < 0.2 ? 0 : Math.random() < 0.6 ? 1 : 2; // 0: fore, 1: mid, 2: back
        const speed = isStorm
          ? (layer === 0 ? 32 : layer === 1 ? 24 : 18) + Math.random() * 8
          : isDrizzle
          ? (layer === 0 ? 12 : layer === 1 ? 9 : 7) + Math.random() * 4
          : (layer === 0 ? 24 : layer === 1 ? 18 : 13) + Math.random() * 6;

        raindrops.push({
          x: Math.random() * (w + 200) - 100,
          y: Math.random() * h,
          length: isStorm
            ? (layer === 0 ? 36 : layer === 1 ? 26 : 18)
            : isDrizzle
            ? (layer === 0 ? 14 : layer === 1 ? 10 : 7)
            : (layer === 0 ? 28 : layer === 1 ? 20 : 14),
          speed,
          thickness: layer === 0 ? 2.0 : layer === 1 ? 1.3 : 0.8,
          alpha: isDrizzle
            ? (layer === 0 ? 0.45 : layer === 1 ? 0.3 : 0.18)
            : (layer === 0 ? 0.75 : layer === 1 ? 0.5 : 0.28),
          layer
        });
      }
    };

    // Helper: Initialize Snowflakes
    const initSnowflakes = (w: number, h: number) => {
      const count = Math.min(180, Math.floor((w * h) / 7500));
      snowflakes = [];
      for (let i = 0; i < count; i++) {
        const isBokeh = Math.random() < 0.12;
        const radius = isBokeh ? Math.random() * 4.5 + 4 : Math.random() * 2.5 + 1.2;
        snowflakes.push({
          x: Math.random() * (w + 100) - 50,
          y: Math.random() * h,
          radius,
          speedY: isBokeh ? Math.random() * 0.9 + 1.2 : Math.random() * 1.4 + 0.8,
          alpha: isBokeh ? Math.random() * 0.35 + 0.25 : Math.random() * 0.5 + 0.45,
          swayFreq: Math.random() * 1.5 + 0.8,
          swayAmp: Math.random() * 1.2 + 0.5,
          swayPhase: Math.random() * Math.PI * 2,
          drift: Math.random() * 0.6 - 0.1,
          isBokeh
        });
      }
    };

    // Helper: Initialize Clouds
    const initClouds = (w: number, h: number, isDenseFog: boolean) => {
      clouds = [];
      const layerCount = isDenseFog ? 5 : 4;
      for (let l = 0; l < layerCount; l++) {
        const speed = (0.12 + l * 0.16) * (l % 2 === 0 ? 1 : 1.15);
        const yBase = isDenseFog ? h * (0.15 + l * 0.18) : h * (0.08 + l * 0.14);
        const scale = isDenseFog ? 1.3 + l * 0.2 : 0.9 + l * 0.25;
        const lobes: CloudLobe[] = [];
        const lobeCount = isDenseFog ? 9 : 7;
        for (let j = 0; j < lobeCount; j++) {
          lobes.push({
            relX: (j - lobeCount / 2) * (70 * scale) + (Math.random() - 0.5) * 40,
            relY: (Math.random() - 0.5) * (40 * scale),
            radius: (Math.random() * 45 + 55) * scale,
            alpha: Math.random() * 0.15 + 0.12
          });
        }
        clouds.push({
          x: Math.random() * w,
          y: yBase,
          speed,
          scale,
          alpha: isDenseFog ? 0.35 : 0.28,
          lobes
        });
      }
    };

    // Recursive procedural lightning generator
    const generateLightningBranch = (
      startX: number,
      startY: number,
      targetX: number,
      targetY: number,
      depth = 0
    ): LightningBranch[] => {
      const branches: LightningBranch[] = [];
      const nodes: LightningBoltNode[] = [{ x: startX, y: startY }];

      let currX = startX;
      let currY = startY;
      const segments = Math.max(6, Math.floor(Math.abs(targetY - startY) / 25));
      const dy = (targetY - startY) / segments;

      for (let i = 1; i <= segments; i++) {
        const progress = i / segments;
        const sway = (Math.random() - 0.5) * 55 * (1 - progress * 0.3);
        currX += (targetX - currX) * 0.2 + sway;
        currY += dy;
        nodes.push({ x: currX, y: currY });

        // Branching fork opportunity
        if (depth < 2 && Math.random() < 0.22 && i > 2 && i < segments - 1) {
          const forkAngle = (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.4);
          const forkLength = (targetY - startY) * 0.45 * (1 - depth * 0.35);
          const forkEndX = currX + Math.sin(forkAngle) * forkLength;
          const forkEndY = currY + Math.cos(forkAngle) * forkLength;
          const subBranches = generateLightningBranch(currX, currY, forkEndX, forkEndY, depth + 1);
          branches.push(...subBranches);
        }
      }

      branches.push({
        nodes,
        width: Math.max(1, 3.5 - depth * 1.2),
        alpha: 1 - depth * 0.25
      });

      return branches;
    };

    // Trigger thunderstorm lightning & pulse specular gleam on glass cards
    const triggerLightning = (w: number, h: number) => {
      const startX = Math.random() * (w * 0.7) + w * 0.15;
      const targetX = startX + (Math.random() - 0.5) * (w * 0.4);
      const targetY = h * (0.65 + Math.random() * 0.25);

      lightningState = {
        active: true,
        timer: 450, // 450ms animation duration
        flashAlpha: 0.88,
        branches: generateLightningBranch(startX, 0, targetX, targetY)
      };

      // Pulse liquid-glass cards in the DOM
      try {
        const cards = document.querySelectorAll('.liquid-glass');
        cards.forEach((card) => {
          card.classList.remove('lightning-flash-pulse');
          // Trigger browser reflow
          void (card as HTMLElement).offsetWidth;
          card.classList.add('lightning-flash-pulse');
        });
      } catch {
        // Silently catch in non-browser context
      }
    };

    // Resize handler
    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);

      // Re-init scene-specific particle arrays
      initStars(width, height);
      initRaindrops(width, height, currentScene === 'thunderstorm', currentScene === 'drizzle');
      initSnowflakes(width, height);
      initClouds(width, height, currentScene === 'fog');
      updateCardBounds();
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);
    resize();

    // ==========================================
    // RENDER PASSES
    // ==========================================

    const renderSunnyDay = (t: number, dt: number) => {
      // 1. Deep azure-to-cerulean atmospheric sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0.0, '#04437a'); // deep zenith azure
      skyGrad.addColorStop(0.35, '#0b6ebd'); // rich azure
      skyGrad.addColorStop(0.7, '#2ba2f0'); // bright cerulean
      skyGrad.addColorStop(1.0, '#75cbfb'); // warm horizon glow
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      const sunX = width > 768 ? width * 0.78 : width * 0.72;
      const sunY = height * 0.2;
      const baseSunRadius = width > 768 ? 44 : 36;

      // Softly pulsing radial glow
      const pulse = Math.sin(t * 1.8) * 0.08 + 0.95;
      const outerGlowRadius = baseSunRadius * 7.5 * pulse;

      const glowGrad = ctx.createRadialGradient(sunX, sunY, baseSunRadius * 0.5, sunX, sunY, outerGlowRadius);
      glowGrad.addColorStop(0.0, 'rgba(255, 255, 245, 0.95)');
      glowGrad.addColorStop(0.18, 'rgba(255, 235, 150, 0.6)');
      glowGrad.addColorStop(0.45, 'rgba(255, 195, 80, 0.22)');
      glowGrad.addColorStop(0.75, 'rgba(255, 160, 40, 0.08)');
      glowGrad.addColorStop(1.0, 'rgba(255, 140, 0, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, outerGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer coronal rays (Rotating clockwise)
      sunRotation += dt * 0.12;
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(sunRotation);

      const rayCount = 16;
      for (let i = 0; i < rayCount; i++) {
        const rayAngle = (i / rayCount) * Math.PI * 2;
        const rayLen = (baseSunRadius * 2.8 + (i % 2 === 0 ? 35 : 18)) * pulse;
        const rayWidth = i % 2 === 0 ? 0.08 : 0.05;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rayLen, rayAngle - rayWidth, rayAngle + rayWidth);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 248, 210, 0.16)';
        ctx.fill();
      }
      ctx.restore();

      // Inner coronal rays (Rotating counter-clockwise)
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(-sunRotation * 1.4);
      const innerRayCount = 20;
      for (let i = 0; i < innerRayCount; i++) {
        const rayAngle = (i / innerRayCount) * Math.PI * 2;
        const rayLen = (baseSunRadius * 1.8 + (i % 3 === 0 ? 22 : 12)) * pulse;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rayLen, rayAngle - 0.04, rayAngle + 0.04);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 230, 0.22)';
        ctx.fill();
      }
      ctx.restore();

      // Counter-rotating lens flare ring & chromatic halo
      lensFlareRotation -= dt * 0.09;
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(lensFlareRotation);

      // Chromatic halo ring
      const haloRadius = baseSunRadius * 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 230, 180, 0.18)';
      ctx.lineWidth = 14;
      ctx.stroke();

      // Prismatic flare spots along optical axis towards screen center
      const centerX = width * 0.5 - sunX;
      const centerY = height * 0.5 - sunY;

      const flareDistances = [0.35, 0.65, 0.95, 1.35];
      const flareSizes = [16, 28, 12, 38];
      const flareColors = [
        'rgba(255, 210, 130, 0.14)',
        'rgba(140, 220, 255, 0.12)',
        'rgba(255, 160, 210, 0.1)',
        'rgba(255, 240, 180, 0.08)'
      ];

      for (let f = 0; f < flareDistances.length; f++) {
        const fx = centerX * flareDistances[f];
        const fy = centerY * flareDistances[f];
        const rad = flareSizes[f] * pulse;
        const flareG = ctx.createRadialGradient(fx, fy, 0, fx, fy, rad);
        flareG.addColorStop(0, flareColors[f]);
        flareG.addColorStop(1, 'transparent');
        ctx.fillStyle = flareG;
        ctx.beginPath();
        ctx.arc(fx, fy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Brilliant core sun disc
      const coreGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, baseSunRadius);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.65, '#fff6d6');
      coreGrad.addColorStop(1, '#ffdf80');

      ctx.beginPath();
      ctx.arc(sunX, sunY, baseSunRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = 'rgba(255, 235, 150, 0.8)';
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    };

    const renderClearNight = (t: number, dt: number) => {
      // 1. Midnight indigo cosmic sky gradient
      const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
      nightGrad.addColorStop(0.0, '#03050c'); // deep cosmic obsidian
      nightGrad.addColorStop(0.4, '#071026'); // midnight indigo
      nightGrad.addColorStop(0.8, '#0d1b3e'); // deep twilight blue
      nightGrad.addColorStop(1.0, '#15244c'); // soft nocturnal horizon
      ctx.fillStyle = nightGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Twinkling Starfield
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.45;
        const currentAlpha = Math.max(0.08, Math.min(1, s.baseAlpha + twinkle));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 3. Occasional Shooting Star
      shootingStarCooldown -= dt * 1000;
      if (shootingStarCooldown <= 0 && shootingStars.length === 0 && Math.random() < 0.6) {
        shootingStars.push({
          x: Math.random() * (width * 0.7) + width * 0.1,
          y: Math.random() * (height * 0.35) + 30,
          vx: Math.random() * 8 + 12,
          vy: Math.random() * 4 + 5,
          length: Math.random() * 70 + 80,
          alpha: 1.0,
          life: 0,
          maxLife: 0.85
        });
        shootingStarCooldown = 7000 + Math.random() * 6000;
      }

      for (let sIdx = shootingStars.length - 1; sIdx >= 0; sIdx--) {
        const meteor = shootingStars[sIdx];
        meteor.life += dt;
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        const progress = meteor.life / meteor.maxLife;
        meteor.alpha = Math.max(0, 1 - progress);

        if (progress >= 1 || meteor.x > width + 100 || meteor.y > height) {
          shootingStars.splice(sIdx, 1);
          continue;
        }

        const tailX = meteor.x - (meteor.vx / Math.hypot(meteor.vx, meteor.vy)) * meteor.length;
        const tailY = meteor.y - (meteor.vy / Math.hypot(meteor.vx, meteor.vy)) * meteor.length;

        const mGrad = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
        mGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        mGrad.addColorStop(0.7, `rgba(180, 220, 255, ${meteor.alpha * 0.6})`);
        mGrad.addColorStop(1, `rgba(255, 255, 255, ${meteor.alpha})`);

        ctx.strokeStyle = mGrad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(meteor.x, meteor.y);
        ctx.stroke();
      }

      // 4. Glowing Crescent Moon
      const moonX = width > 768 ? width * 0.78 : width * 0.74;
      const moonY = height * 0.2;
      const moonR = width > 768 ? 38 : 30;

      // Outer Moonlight Halo Glow
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 4.8);
      moonGlow.addColorStop(0, 'rgba(200, 225, 255, 0.32)');
      moonGlow.addColorStop(0.35, 'rgba(140, 185, 255, 0.12)');
      moonGlow.addColorStop(0.7, 'rgba(90, 140, 240, 0.04)');
      moonGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 4.8, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Glowing Crescent Moon geometry
      ctx.save();
      // Draw outer illuminated moon disc
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(215, 235, 255, 0.85)';
      ctx.shadowBlur = 22;
      ctx.fill();

      // Cut out shadow portion to form pristine crescent
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(moonX - moonR * 0.55, moonY - moonR * 0.25, moonR * 0.92, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.restore();

      // Subtle celestial starlight glint near lunar edge
      const glintX = moonX + moonR * 0.65;
      const glintY = moonY + moonR * 0.45;
      ctx.beginPath();
      ctx.arc(glintX, glintY, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const renderRainAndDrizzle = (_t: number, dt: number, isThunder: boolean, isDrizzle: boolean) => {
      // 1. Slate-blue atmospheric gradient
      const rainGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isThunder) {
        rainGrad.addColorStop(0.0, '#0a0d14'); // ominous deep storm
        rainGrad.addColorStop(0.5, '#121822');
        rainGrad.addColorStop(1.0, '#1c2432');
      } else if (isDrizzle) {
        rainGrad.addColorStop(0.0, '#1d2735');
        rainGrad.addColorStop(0.5, '#293748');
        rainGrad.addColorStop(1.0, '#394b5e');
      } else {
        rainGrad.addColorStop(0.0, '#121a24'); // classic slate-blue
        rainGrad.addColorStop(0.5, '#1e2c3c');
        rainGrad.addColorStop(1.0, '#2e3e50');
      }
      ctx.fillStyle = rainGrad;
      ctx.fillRect(0, 0, width, height);

      // Periodically refresh card bounding boxes for splash collision
      const now = performance.now();
      if (now - lastCardQueryTime > 900) {
        updateCardBounds();
        lastCardQueryTime = now;
      }

      // Wind tilt angle
      const windAngle = isThunder ? 0.32 : isDrizzle ? 0.12 : 0.22;
      const windDx = Math.sin(windAngle);
      const windDy = Math.cos(windAngle);

      // 2. Multi-depth angled falling raindrops
      for (let i = 0; i < raindrops.length; i++) {
        const drop = raindrops[i];
        drop.x += windDx * drop.speed;
        drop.y += windDy * drop.speed;

        // Collision detection along top of forecast cards or screen bottom
        let collided = false;
        let collisionY = height - 15;

        // Check cards
        for (let c = 0; c < cardBounds.length; c++) {
          const card = cardBounds[c];
          if (drop.x >= card.left && drop.x <= card.right && drop.y >= card.top && drop.y <= card.top + 25) {
            collided = true;
            collisionY = card.top;
            break;
          }
        }

        // Screen bottom collision
        if (!collided && drop.y >= height - 20) {
          collided = true;
          collisionY = height - 12;
        }

        if (collided) {
          // Trigger splash ripple & droplet beads
          if (ripples.length < 50 && (drop.layer === 0 || (drop.layer === 1 && Math.random() < 0.4))) {
            ripples.push({
              x: drop.x,
              y: collisionY,
              radiusX: 2,
              radiusY: 0.8,
              maxRadius: drop.layer === 0 ? 18 : 12,
              alpha: drop.alpha * 0.9,
              life: 0,
              maxLife: 0.35
            });

            // Bounce micro splash droplets upwards
            const splashCount = isThunder ? 3 : 2;
            for (let s = 0; s < splashCount; s++) {
              if (splashDrops.length < 80) {
                splashDrops.push({
                  x: drop.x,
                  y: collisionY,
                  vx: (Math.random() - 0.5) * 3 + windDx * 1.5,
                  vy: -(Math.random() * 2.8 + 1.2),
                  alpha: drop.alpha,
                  life: 0,
                  maxLife: 0.28,
                  radius: drop.thickness * 0.75
                });
              }
            }
          }

          // Reset drop to top
          drop.y = -drop.length - Math.random() * 50;
          drop.x = Math.random() * (width + 250) - 150;
          continue;
        }

        // If off right screen, wrap
        if (drop.x > width + 150) {
          drop.x = -100;
        }

        // Draw raindrop streak with gradient tail
        const tailX = drop.x - windDx * drop.length;
        const tailY = drop.y - windDy * drop.length;

        ctx.strokeStyle = `rgba(215, 235, 255, ${drop.alpha})`;
        ctx.lineWidth = drop.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(drop.x, drop.y);
        ctx.stroke();
      }

      // 3. Render splash ripples along top of forecast cards
      for (let rIdx = ripples.length - 1; rIdx >= 0; rIdx--) {
        const rip = ripples[rIdx];
        rip.life += dt;
        const p = rip.life / rip.maxLife;
        if (p >= 1) {
          ripples.splice(rIdx, 1);
          continue;
        }

        const currentRadX = rip.radiusX + (rip.maxRadius - rip.radiusX) * Math.sqrt(p);
        const currentRadY = currentRadX * 0.34;
        const currentAlpha = rip.alpha * (1 - p);

        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, currentRadX, currentRadY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(225, 240, 255, ${currentAlpha})`;
        ctx.lineWidth = 1.2 * (1 - p * 0.5);
        ctx.stroke();
      }

      // 4. Render bouncing splash droplets
      for (let sIdx = splashDrops.length - 1; sIdx >= 0; sIdx--) {
        const sp = splashDrops[sIdx];
        sp.life += dt;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 9.8 * dt * 3.5; // gravity
        const p = sp.life / sp.maxLife;

        if (p >= 1) {
          splashDrops.splice(sIdx, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 245, 255, ${sp.alpha * (1 - p)})`;
        ctx.fill();
      }
    };

    const renderThunderstorm = (t: number, dt: number) => {
      // Base heavy rain pass
      renderRainAndDrizzle(t, dt, true, false);

      // Check lightning trigger timer
      nextLightningTime -= dt * 1000;
      if (nextLightningTime <= 0 && !lightningState.active) {
        triggerLightning(width, height);
        nextLightningTime = 3000 + Math.random() * 5500;
      }

      // Render Active Lightning Sequence
      if (lightningState.active) {
        lightningState.timer -= dt * 1000;
        const duration = 450;
        const elapsed = duration - lightningState.timer;

        // Double flicker pattern
        let flashOpacity = 0;
        if (elapsed < 60) {
          flashOpacity = (elapsed / 60) * 0.9;
        } else if (elapsed < 130) {
          flashOpacity = 0.45 + (1 - (elapsed - 60) / 70) * 0.35;
        } else if (elapsed < 200) {
          flashOpacity = 0.85; // second intense strike
        } else {
          flashOpacity = Math.max(0, 0.85 * (1 - (elapsed - 200) / 250));
        }

        // Sky illumination flash
        if (flashOpacity > 0.02) {
          ctx.fillStyle = `rgba(225, 240, 255, ${flashOpacity * 0.65})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw Jagged Branching Lightning Bolts
        if (elapsed < 280) {
          ctx.save();
          for (let b = 0; b < lightningState.branches.length; b++) {
            const branch = lightningState.branches[b];
            if (branch.nodes.length < 2) continue;

            // Outer electric cyan glow
            ctx.strokeStyle = `rgba(130, 210, 255, ${branch.alpha * flashOpacity * 1.2})`;
            ctx.lineWidth = branch.width * 2.8;
            ctx.shadowColor = '#60a5fa';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.moveTo(branch.nodes[0].x, branch.nodes[0].y);
            for (let n = 1; n < branch.nodes.length; n++) {
              ctx.lineTo(branch.nodes[n].x, branch.nodes[n].y);
            }
            ctx.stroke();

            // Inner intense white core
            ctx.strokeStyle = `rgba(255, 255, 255, ${branch.alpha * flashOpacity * 1.5})`;
            ctx.lineWidth = branch.width;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
          ctx.restore();
        }

        if (lightningState.timer <= 0) {
          lightningState.active = false;
        }
      }
    };

    const renderCloudyAndFog = (t: number, dt: number, isFog: boolean) => {
      // 1. Atmosphere Gradient
      const cloudGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isFog) {
        cloudGrad.addColorStop(0.0, '#334155');
        cloudGrad.addColorStop(0.5, '#475569');
        cloudGrad.addColorStop(1.0, '#94a3b8');
      } else {
        cloudGrad.addColorStop(0.0, '#1e293b');
        cloudGrad.addColorStop(0.45, '#334155');
        cloudGrad.addColorStop(0.85, '#64748b');
        cloudGrad.addColorStop(1.0, '#94a3b8');
      }
      ctx.fillStyle = cloudGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Parallax Translucent Volumetric Clouds
      for (let c = 0; c < clouds.length; c++) {
        const cloud = clouds[c];
        cloud.x += cloud.speed * 60 * dt;

        // Toroidal wrap
        const maxBound = width + 400 * cloud.scale;
        if (cloud.x > maxBound) {
          cloud.x = -400 * cloud.scale;
        }

        ctx.save();
        ctx.translate(cloud.x, cloud.y);

        for (let l = 0; l < cloud.lobes.length; l++) {
          const lobe = cloud.lobes[l];
          const lobeGrad = ctx.createRadialGradient(
            lobe.relX,
            lobe.relY,
            lobe.radius * 0.15,
            lobe.relX,
            lobe.relY,
            lobe.radius
          );
          lobeGrad.addColorStop(0, `rgba(255, 255, 255, ${lobe.alpha * cloud.alpha * 1.6})`);
          lobeGrad.addColorStop(0.5, `rgba(240, 245, 255, ${lobe.alpha * cloud.alpha * 0.9})`);
          lobeGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = lobeGrad;
          ctx.beginPath();
          ctx.arc(lobe.relX, lobe.relY, lobe.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // If Fog, draw subtle undulating horizontal mist bands
      if (isFog) {
        for (let f = 0; f < 3; f++) {
          const mistY = height * (0.4 + f * 0.22) + Math.sin(t * 0.8 + f) * 16;
          const mistGrad = ctx.createLinearGradient(0, mistY - 60, 0, mistY + 60);
          mistGrad.addColorStop(0, 'transparent');
          mistGrad.addColorStop(0.5, 'rgba(235, 245, 255, 0.16)');
          mistGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = mistGrad;
          ctx.fillRect(0, mistY - 60, width, 120);
        }
      }
    };

    const renderSnow = (t: number, dt: number) => {
      // 1. Alpine Twilight Gradient
      const snowGrad = ctx.createLinearGradient(0, 0, 0, height);
      snowGrad.addColorStop(0.0, '#0f172a');
      snowGrad.addColorStop(0.4, '#1e293b');
      snowGrad.addColorStop(0.8, '#334155');
      snowGrad.addColorStop(1.0, '#475569');
      ctx.fillStyle = snowGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Sinusoidal Falling Snow Particles
      for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];
        flake.y += flake.speedY * 60 * dt;
        flake.x += Math.sin(t * flake.swayFreq + flake.swayPhase) * flake.swayAmp + flake.drift;

        // Wrap around bottom
        if (flake.y > height + 20) {
          flake.y = -20;
          flake.x = Math.random() * (width + 100) - 50;
        }
        if (flake.x > width + 50) flake.x = -50;
        if (flake.x < -50) flake.x = width + 50;

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

        if (flake.isBokeh) {
          // Soft bokeh snowflake disc
          const bGrad = ctx.createRadialGradient(flake.x, flake.y, 0, flake.x, flake.y, flake.radius);
          bGrad.addColorStop(0, `rgba(255, 255, 255, ${flake.alpha})`);
          bGrad.addColorStop(0.7, `rgba(240, 245, 255, ${flake.alpha * 0.4})`);
          bGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = bGrad;
          ctx.fill();
        } else {
          // Crisp snowflake
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    };

    // ==========================================
    // 60FPS ANIMATION LOOP (requestAnimationFrame)
    // ==========================================
    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      const t = time / 1000;

      // Handle DPR scaling properly
      ctx.save();
      ctx.scale(dpr, dpr);

      switch (currentScene) {
        case 'sunny':
          renderSunnyDay(t, dt);
          break;
        case 'night':
          renderClearNight(t, dt);
          break;
        case 'rain':
          renderRainAndDrizzle(t, dt, false, false);
          break;
        case 'drizzle':
          renderRainAndDrizzle(t, dt, false, true);
          break;
        case 'thunderstorm':
          renderThunderstorm(t, dt);
          break;
        case 'snow':
          renderSnow(t, dt);
          break;
        case 'fog':
          renderCloudyAndFog(t, dt, true);
          break;
        case 'cloudy':
        default:
          renderCloudyAndFog(t, dt, false);
          break;
      }

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
    };
  }, [currentScene, weatherCode, isDay, showcaseMode]);

  return (
    <div
      className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default CanvasBackground;
