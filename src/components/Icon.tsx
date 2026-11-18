import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'check'
  | 'chevronRight'
  | 'coins'
  | 'download'
  | 'equal'
  | 'file'
  | 'group'
  | 'info'
  | 'layers'
  | 'refresh'
  | 'scale'
  | 'shuffle'
  | 'sliders'
  | 'sparkles'
  | 'target'
  | 'trophy'
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
    sparkles: (
      <>
        <path d="m12 3 1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3z" />
        <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z" />
        <path d="m5 14 .7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7z" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
        <path d="M8 6H4v1a3 3 0 0 0 3 3h1M16 6h4v1a3 3 0 0 1-3 3h-1" />
        <path d="M12 13v4M8 21h8M9 17h6" />
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
