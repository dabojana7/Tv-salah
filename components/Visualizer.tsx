
import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 40;
    const barWidth = 4;
    const spacing = 2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#10b981';

      for (let i = 0; i < bars; i++) {
        const height = Math.random() * (isActive ? canvas.height * 0.8 : 5) + 5;
        const x = i * (barWidth + spacing);
        const y = (canvas.height - height) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={240} 
      height={60} 
      className="w-full h-16 opacity-80"
    />
  );
};

export default Visualizer;
