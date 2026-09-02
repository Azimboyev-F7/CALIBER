import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';

export interface ColorBendsProps {
  color?: string | string[];
  colors?: string[];
  speed?: number;
  frequency?: number;
  noise?: number;
  bandWidth?: number;
  rotation?: number;
  fadeTop?: number;
  fadeBottom?: number;
  iterations?: number;
  intensity?: number;
  scale?: number;
  warpStrength?: number;
  className?: string;
  style?: React.CSSProperties;
}

const VERTEX_SHADER = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFrequency;
  uniform float uNoise;
  uniform float uBandWidth;
  uniform float uRotation;
  uniform float uFadeTop;
  uniform float uFadeBottom;
  uniform int uIterations;
  uniform float uIntensity;
  uniform float uScale;
  uniform float uWarpStrength;

  uniform vec3 uColor0;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  vec2 rotateUV(vec2 uv, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c) * uv;
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = (st - 0.5) * aspect;

    // Deep cosmic dark violet background matching React Bits palette
    vec3 bg = vec3(0.024, 0.012, 0.048);

    // Apply rotation
    float rad = uRotation * 0.01745329251;
    p = rotateUV(p, rad);

    float t = uTime * uSpeed * 1.5;

    // Domain warping
    vec2 q = p * (1.15 / max(uScale, 0.1));
    for (int i = 0; i < 4; i++) {
      if (i >= uIterations + 1) break;
      float fi = float(i + 1);
      q += vec2(
        sin(q.y * uFrequency * 1.8 + t * 0.8 + fi * 1.1) * (0.38 * uWarpStrength) / fi,
        cos(q.x * uFrequency * 1.4 - t * 0.7 + fi * 1.4) * (0.38 * uWarpStrength) / fi
      );
    }

    // Ribbon waves
    float wave1 = sin(q.x * uFrequency * 2.8 + q.y * 1.5 + t);
    float band1 = smoothstep(uBandWidth * 2.5, 0.0, abs(wave1));
    float glow1 = exp(-abs(wave1) * (4.5 / max(uBandWidth, 0.02)));

    float wave2 = cos(q.y * uFrequency * 3.2 - q.x * 1.2 + t * 0.6);
    float band2 = smoothstep(uBandWidth * 2.2, 0.0, abs(wave2));
    float glow2 = exp(-abs(wave2) * (5.0 / max(uBandWidth, 0.02)));

    float wave3 = sin((q.x + q.y) * uFrequency * 2.2 - t * 0.5);
    float band3 = smoothstep(uBandWidth * 2.0, 0.0, abs(wave3));

    vec3 col = bg;
    col += uColor0 * (band1 * 0.9 + glow1 * 0.8) * uIntensity;
    col += uColor1 * (band2 * 0.7 + glow2 * 0.6) * uIntensity;
    col += uColor3 * (band3 * 0.5) * uIntensity;
    col += uColor2 * (sin(length(q) * 2.0 - t * 0.4) * 0.5 + 0.5) * 0.3 * uIntensity;

    // Tone map
    col = col / (col + vec3(0.85));
    col *= 1.22;

    // Film grain noise
    if (uNoise > 0.001) {
      float grain = (hash21(gl_FragCoord.xy + fract(uTime * 11.23)) - 0.5) * uNoise * 0.35;
      col += grain;
    }

    // Fade top
    if (uFadeTop > 0.0) {
      float topFade = smoothstep(1.0, 1.0 - uFadeTop, st.y);
      col = mix(bg * 0.7, col, topFade);
    }

    // Fade bottom
    if (uFadeBottom > 0.0) {
      float bottomFade = smoothstep(0.0, uFadeBottom, st.y);
      col = mix(bg * 0.7, col, bottomFade);
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export const ColorBends: React.FC<ColorBendsProps> = ({
  color = '#A855F7',
  colors,
  speed = 0.2,
  frequency = 1.0,
  noise = 0.15,
  bandWidth = 0.14,
  rotation = 90,
  fadeTop = 0.75,
  fadeBottom = 0.0,
  iterations = 1,
  intensity = 1.3,
  scale = 1.0,
  warpStrength = 1.0,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Determine palette
    let palette: string[] = [];
    if (colors && colors.length > 0) {
      palette = colors;
    } else if (Array.isArray(color)) {
      palette = color;
    } else if (typeof color === 'string') {
      palette = [
        color,       // #A855F7
        '#C026D3',   // Fuchsia
        '#6366F1',   // Indigo
        '#F472B6',   // Pink
        '#7C3AED'    // Violet
      ];
    } else {
      palette = ['#A855F7', '#C026D3', '#6366F1', '#F472B6', '#7C3AED'];
    }

    const c0 = new Color(palette[0] || '#A855F7');
    const c1 = new Color(palette[1] || '#C026D3');
    const c2 = new Color(palette[2] || '#6366F1');
    const c3 = new Color(palette[3] || '#F472B6');
    const c4 = new Color(palette[4] || '#7C3AED');

    // Create OGL Renderer
    const renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    // Full screen triangle geometry
    const geometry = new Triangle(gl);

    // OGL Program
    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uResolution: { value: [gl.canvas.width, gl.canvas.height] },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uFrequency: { value: frequency },
        uNoise: { value: noise },
        uBandWidth: { value: bandWidth },
        uRotation: { value: rotation },
        uFadeTop: { value: fadeTop },
        uFadeBottom: { value: fadeBottom },
        uIterations: { value: Math.max(1, Math.min(4, iterations)) },
        uIntensity: { value: intensity },
        uScale: { value: scale },
        uWarpStrength: { value: warpStrength },
        uColor0: { value: [c0.r, c0.g, c0.b] },
        uColor1: { value: [c1.r, c1.g, c1.b] },
        uColor2: { value: [c2.r, c2.g, c2.b] },
        uColor3: { value: [c3.r, c3.g, c3.b] },
        uColor4: { value: [c4.r, c4.g, c4.b] }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener('resize', resize);

    let animationId: number;
    let isDestroyed = false;
    const startTime = performance.now();

    const update = (now: number) => {
      if (isDestroyed) return;
      program.uniforms.uTime.value = (now - startTime) * 0.001;
      renderer.render({ scene: mesh });
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    color,
    colors,
    speed,
    frequency,
    noise,
    bandWidth,
    rotation,
    fadeTop,
    fadeBottom,
    iterations,
    intensity,
    scale,
    warpStrength
  ]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
      style={style}
    >
      {/* Subtle React-Bits Signature Dot Matrix Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>
  );
};

export default ColorBends;
