'use client';

import { useRef, useEffect } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    v_uv.y = 1.0 - v_uv.y;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_video;
  uniform vec2 u_resolution;
  uniform float u_cellSize;
  uniform float u_dimming;

  float getChar(float brightness, vec2 p) {
    vec2 grid = floor(p * 4.0);
    if (brightness < 0.15) return 0.0;
    if (brightness < 0.3) return (grid.x == 1.0 && grid.y == 1.0) ? 0.4 : 0.0;
    if (brightness < 0.45) return (grid.x == 1.0 || grid.x == 2.0) && (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
    if (brightness < 0.6) return (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
    if (brightness < 0.75) return (grid.y == 0.0 || grid.y == 3.0) ? 1.0 : (grid.y == 1.0 || grid.y == 2.0) ? 0.5 : 0.0;
    if (brightness < 0.9) return (grid.x == 0.0 || grid.x == 2.0 || grid.y == 0.0 || grid.y == 2.0) ? 1.0 : 0.3;
    return 1.0;
  }

  void main() {
    vec2 cellCount = u_resolution / u_cellSize;
    vec2 cellCoord = floor(v_uv * cellCount);
    vec2 cellUV = (cellCoord + 0.5) / cellCount;
    vec2 localUV = fract(v_uv * cellCount);

    vec4 color = texture2D(u_video, cellUV);
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    // Tint toward cosmic palette (indigo/purple/cyan)
    vec3 tinted = color.rgb;
    tinted.r *= 0.7;
    tinted.g *= 0.75;
    tinted.b *= 1.2;

    float charVal = getChar(brightness, localUV);
    vec3 finalColor = tinted * charVal * u_dimming;

    // Vignette
    vec2 centered = v_uv * 2.0 - 1.0;
    float vignette = 1.0 - dot(centered, centered) * 0.3;
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function VideoAsciiBackground({ src = '/bg-video.mp4', cellSize = 8, dimming = 0.35 }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create video element
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    videoRef.current = video;

    // WebGL setup
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) {
      console.warn('WebGL not available');
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;

    // Fullscreen quad
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uCellSize = gl.getUniformLocation(program, 'u_cellSize');
    const uDimming = gl.getUniformLocation(program, 'u_dimming');
    const uVideo = gl.getUniformLocation(program, 'u_video');

    // Video texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Initialize with 1x1 black pixel
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    let needsDraw = false;

    // Offscreen canvas for downscaling video before GPU upload.
    // Even with a small source video, this guarantees texImage2D never uploads
    // more than ~300x400 pixels regardless of the video's native resolution.
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { willReadFrequently: false });
    const MAX_TEX = 400; // max dimension for the GPU texture

    function updateOffscreenSize() {
      if (!video.videoWidth) return;
      const aspect = video.videoWidth / video.videoHeight;
      if (aspect >= 1) {
        offscreen.width = MAX_TEX;
        offscreen.height = Math.round(MAX_TEX / aspect);
      } else {
        offscreen.height = MAX_TEX;
        offscreen.width = Math.round(MAX_TEX * aspect);
      }
    }

    // Render at half screen resolution — ASCII cells are 8px+ so this is invisible
    function resize() {
      const w = Math.round(window.innerWidth / 2);
      const h = Math.round(window.innerHeight / 2);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      gl.viewport(0, 0, w, h);
      needsDraw = true;
    }

    resize();
    window.addEventListener('resize', resize);

    // Visibility handling
    let paused = false;
    function onVisibilityChange() {
      paused = document.hidden;
      if (paused) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    let videoReady = false;

    function draw() {
      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uCellSize, cellSize);
      gl.uniform1f(uDimming, dimming);
      gl.uniform1i(uVideo, 0);

      gl.enableVertexAttribArray(posLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Prefer requestVideoFrameCallback — only fires when the video decoder has a new frame
    // Falls back to requestAnimationFrame throttled to ~30fps
    const hasRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    function uploadFrame() {
      // Draw video to small offscreen canvas, then upload that (not the raw video)
      if (!offscreen.width) updateOffscreenSize();
      offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
    }

    function onVideoFrame() {
      if (paused || prefersReducedMotion) {
        if (hasRVFC) video.requestVideoFrameCallback(onVideoFrame);
        return;
      }

      uploadFrame();
      draw();

      if (hasRVFC) {
        video.requestVideoFrameCallback(onVideoFrame);
      }
    }

    // Fallback loop for browsers without requestVideoFrameCallback
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 1000 / 30; // cap at 30fps

    function renderFallback(now) {
      animRef.current = requestAnimationFrame(renderFallback);

      if (paused || prefersReducedMotion) return;
      if (now - lastFrameTime < FRAME_INTERVAL) return;
      lastFrameTime = now;

      if (videoReady && video.readyState >= video.HAVE_CURRENT_DATA) {
        uploadFrame();
        needsDraw = true;
      }

      if (needsDraw) {
        draw();
        needsDraw = false;
      }
    }

    video.addEventListener('canplaythrough', () => {
      videoReady = true;
      updateOffscreenSize();
      video.play().catch(() => {});
      if (hasRVFC) {
        video.requestVideoFrameCallback(onVideoFrame);
      }
    });

    video.load();
    if (!hasRVFC) {
      renderFallback(0);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      video.pause();
      video.src = '';
      gl.deleteTexture(texture);
      gl.deleteBuffer(posBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [src, cellSize, dimming]);

  return (
    <canvas
      ref={canvasRef}
      className="cosmic-canvas"
      aria-hidden="true"
    />
  );
}
