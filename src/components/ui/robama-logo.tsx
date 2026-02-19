import { SVGProps } from 'react';

export function RobamaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 70" {...props}>
      <g>
        <rect x="0" y="0" width="18" height="18" fill="#D92D20" />
        <rect x="20" y="0" width="18" height="18" fill="#2F80ED" />
        <rect x="0" y="20" width="18" height="18" fill="#F2C94C" />
      </g>
      <text x="50" y="45" fontFamily="Inter, sans-serif" fontSize="50" fontWeight="bold" fill="black">
        robama
      </text>
    </svg>
  );
}
