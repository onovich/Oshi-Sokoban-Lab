import { Fragment, memo, useId, type CSSProperties } from 'react';

// Fixed distribution: renders and game moves never reshuffle or restart the weather.
const drops = Array.from({ length: 72 }, (_, index) => ({
  x: (index * 137.508) % 1120,
  length: 28 + (index * 7 % 31),
  duration: 0.8 + (index * 13 % 65) / 100,
  delay: -(index * 0.173 % 2),
  opacity: 0.48 + (index % 3) * 0.12,
  landingY: index % 3 === 0 ? 180 + (index * 47 % 760) : undefined,
}));

/** Decorative only: no input, game state, timers or per-frame React updates. */
export const RainEffect = memo(function RainEffect() {
  const gradientId = useId();
  return (
    <svg className="board__weather-film" aria-hidden="true" focusable="false"
      viewBox="0 0 1000 1000" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8dce3" stopOpacity="0.12" />
          <stop offset="0.65" stopColor="#dceaf0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#e7f2f6" />
        </linearGradient>
      </defs>
      {drops.map((drop, index) => {
        const travelY = drop.landingY === undefined ? 1060 : drop.landingY - drop.length;
        const travelX = -travelY * 100 / 1060;
        const duration = drop.landingY === undefined ? drop.duration : drop.duration * (travelY + 60) / 1120 / 0.78;
        const style = { animationDuration: `${duration}s`, animationDelay: `${drop.delay}s`,
          '--rain-opacity': drop.opacity, '--rain-travel-x': `${travelX}px`,
          '--rain-travel-y': `${travelY}px` } as CSSProperties;
        return <Fragment key={index}>
        <line className={`rain-drop${drop.landingY === undefined ? '' : ' rain-drop--landing'}`} x1={drop.x} y1={0}
          x2={drop.x - drop.length * 0.09} y2={drop.length}
          stroke={`url(#${gradientId})`} strokeWidth={index % 3 === 0 ? 2.2 : 1.4}
          vectorEffect="non-scaling-stroke" strokeLinecap="round"
          style={style} />
        {drop.landingY !== undefined ? (
          <g transform={`translate(${drop.x - drop.length * 0.09 + travelX} ${drop.landingY})`}>
            <g className="rain-splash" style={style} fill="none" stroke="#dceaf0" strokeWidth="1">
              <ellipse rx="10" ry="3" vectorEffect="non-scaling-stroke" />
              <path d="M -5 -2 l -4 -5 M 5 -2 l 4 -5 M 0 -3 v -5"
                vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            </g>
          </g>
        ) : null}
        </Fragment>;
      })}
    </svg>
  );
});
