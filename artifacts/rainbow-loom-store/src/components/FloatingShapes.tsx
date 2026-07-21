import { useMemo } from 'react';

const COLORS = ['#FFB6C1', '#40E0D0', '#98FF98', '#FFDAB9', '#E6E6FA', '#FFFACD'];
const SHAPES = ['circle', 'square', 'triangle', 'squiggle', 'dot'];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function FloatingShapes() {
  const shapes = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      type: SHAPES[getRandomInt(0, SHAPES.length - 1)],
      color: COLORS[getRandomInt(0, COLORS.length - 1)],
      size: getRandomInt(30, 80),
      top: `${getRandomInt(0, 100)}%`,
      left: `${getRandomInt(0, 100)}%`,
      rotation: getRandomInt(0, 360),
      delay: getRandomInt(0, 5),
      duration: getRandomInt(10, 20)
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {shapes.map(shape => {
        const style = {
          top: shape.top,
          left: shape.left,
          color: shape.color,
          transform: `rotate(${shape.rotation}deg)`,
          animation: `float ${shape.duration}s ease-in-out ${shape.delay}s infinite alternate`
        };

        if (shape.type === 'circle' || shape.type === 'dot') {
          const finalSize = shape.type === 'dot' ? Math.max(shape.size / 3, 10) : shape.size;
          return <div key={shape.id} className="absolute rounded-full opacity-60" style={{...style, width: finalSize, height: finalSize, backgroundColor: shape.color}} />;
        } else if (shape.type === 'square') {
          return <div key={shape.id} className="absolute rounded-2xl opacity-60" style={{...style, width: shape.size, height: shape.size, backgroundColor: shape.color}} />;
        } else if (shape.type === 'triangle') {
          return (
            <svg key={shape.id} className="absolute opacity-60" style={{...style, width: shape.size, height: shape.size}} viewBox="0 0 100 100">
              <polygon points="50,10 90,90 10,90" fill="currentColor" />
            </svg>
          );
        } else {
          return (
            <svg key={shape.id} className="absolute opacity-60" style={{...style, width: shape.size, height: shape.size}} viewBox="0 0 100 100" strokeWidth="15" strokeLinecap="round" fill="none">
              <path d="M10,50 Q25,20 50,50 T90,50" stroke="currentColor" />
            </svg>
          );
        }
      })}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
