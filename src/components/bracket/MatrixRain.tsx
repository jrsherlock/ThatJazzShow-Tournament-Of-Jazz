'use client';

import { useEffect, useRef } from 'react';

/**
 * Canvas-based 'Matrix rain' background using hex digits, cyber terminology,
 * and threat actor shorthand. Themed in the project's red accent color palette.
 */
export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Characters: hex digits + cyber terms + threat actor shorthand
    const chars =
      '01ABCDEFabcdef{}>_CVE2024EXPLOIT0xDEADBEEFAPT28LAZARUSVOLTROOTHACKPWNSHELL#$!@<>/0123456789';
    const charArray = Array.from(chars);

    const fontSize = 14;
    let columns: number;
    let drops: number[];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      columns = Math.floor(canvas!.width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -100);
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      // Semi-transparent black overlay creates the trail effect
      ctx!.fillStyle = 'rgba(10, 10, 10, 0.06)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < columns; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Vary the red color slightly per column
        const hue = 0 + Math.random() * 15; // 0-15 range (red)
        const lightness = 45 + Math.random() * 20;
        const alpha = 0.3 + Math.random() * 0.4;

        ctx!.fillStyle = `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
        ctx!.font = `${fontSize}px "Courier New", monospace`;
        ctx!.fillText(char, x, y);

        // Reset drop to top when it goes off screen, with randomness
        if (y > canvas!.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i] += 0.5 + Math.random() * 0.5;
      }
    }

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}
