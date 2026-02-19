import { SVGProps } from 'react';

export function RobamaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 100" {...props}>
      <g transform="translate(0, 10)">
        <rect x="0" y="0" width="18" height="18" fill="#D92D20" />
        <rect x="22" y="0" width="18" height="18" fill="#2F80ED" />
        <rect x="0" y="22" width="18" height="18" fill="#F2C94C" />
      </g>
      <text x="50" y="55" fontFamily="Inter, sans-serif" fontSize="50" fontWeight="bold" fill="black">
        robama
      </text>
      <text x="145" y="85" fontFamily="Inter, sans-serif" fontSize="20" fill="gray">
        Simply good chemistry
      </text>
    </svg>
  );
}
