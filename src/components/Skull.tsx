import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { colors } from '../tokens';

interface SkullProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export default function Skull({ size = 40, color = colors.orange, opacity = 1 }: SkullProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={opacity}>
      <G>
        {/* Skull cranium */}
        <Path
          d="M32 6C19 6 10 16 10 27c0 7 3.5 12.5 8 16v5c0 2 1.5 3 3 3h22c1.5 0 3-1 3-3v-5c4.5-3.5 8-9 8-16C54 16 45 6 32 6z"
          fill={color}
        />
        {/* Left eye socket */}
        <Circle cx="24" cy="26" r="5.5" fill="#0A0A0A" />
        {/* Right eye socket */}
        <Circle cx="40" cy="26" r="5.5" fill="#0A0A0A" />
        {/* Nose */}
        <Path
          d="M30 34l2 4 2-4z"
          fill="#0A0A0A"
        />
        {/* Teeth */}
        <Rect x="23" y="39" width="4" height="5" rx="1" fill="#0A0A0A" />
        <Rect x="29" y="39" width="4" height="5" rx="1" fill="#0A0A0A" />
        <Rect x="35" y="39" width="4" height="5" rx="1" fill="#0A0A0A" />
        {/* Left dumbbell crossbone */}
        <Rect x="4" y="50" width="22" height="4" rx="2" fill={color} transform="rotate(-35 15 52)" />
        <Rect x="2" y="44" width="6" height="8" rx="2" fill={color} transform="rotate(-35 5 48)" />
        <Rect x="22" y="52" width="6" height="8" rx="2" fill={color} transform="rotate(-35 25 56)" />
        {/* Right dumbbell crossbone */}
        <Rect x="38" y="50" width="22" height="4" rx="2" fill={color} transform="rotate(35 49 52)" />
        <Rect x="56" y="44" width="6" height="8" rx="2" fill={color} transform="rotate(35 59 48)" />
        <Rect x="36" y="52" width="6" height="8" rx="2" fill={color} transform="rotate(35 39 56)" />
      </G>
    </Svg>
  );
}
