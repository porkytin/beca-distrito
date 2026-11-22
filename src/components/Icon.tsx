import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'calculator'
  | 'check'
  | 'chevronRight'
  | 'coins'
  | 'download'
  | 'equal'
  | 'file'
  | 'group'
  | 'info'
  | 'layers'
  | 'list'
  | 'plus'
  | 'refresh'
  | 'scale'
  | 'shuffle'
  | 'sliders'
  | 'target'
  | 'trash'
  | 'upload'
  | 'users'
  | 'x';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...props }: IconProps) {
  const paths: Record<IconName, ReactNode> = {
    arrowLeft: <path d="M19 12H5m0 0 6-6m-6 6 6 6" />,
    arrowRight: <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
    arrowUpRight: <path d="M7 17 17 7m0 0H8m9 0v9" />,
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01M8 18h2M12 18h2M16 18h.01" />
      </>
    ),
    check: <path d="m5 12 4.5 4.5L19 7" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    coins: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m0 0 5-5m-5 5-5-5" />
        <path d="M5 21h14" />
      </>
    ),
    equal: (
      <>
        <path d="M5 9h14M5 15h14" />
      </>
    ),
    file: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" />
      </>
    ),
    group: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.5-3.5 2.6-5.5 5.5-5.5s5 2 5.5 5.5" />
        <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 14.6c2 .6 3.2 2.4 3.5 5.4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
    list: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 5.7" />
        <path d="M20 5v6h-6" />
      </>
    ),
    scale: (
      <>
        <path d="M12 3v18M8 21h8" />
        <path d="m5 7 7-4 7 4" />
        <path d="M5 7 2 14h6zM19 7l-3 7h6z" />
      </>
    ),
    shuffle: (
      <>
        <path d="M16 3h5v5M21 3l-7 7" />
        <path d="M16 21h5v-5M21 21l-7-7" />
        <path d="M3 7h4l10 10h4M3 17h4l3-3" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3" />
        <circle cx="15" cy="6" r="2" />
        <circle cx="9" cy="12" r="2" />
        <circle cx="15" cy="18" r="2" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 21V9m0 0 5 5m-5-5-5 5" />
        <path d="M5 3h14" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17.5" cy="9" r="2.5" />
        <path d="M16 14.2c2.8.3 5 2.6 5 5.8" />
      </>
    ),
    x: <path d="M6 6l12 12M18 6 6 18" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
