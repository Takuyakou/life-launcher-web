type IconName =
  | "activity"
  | "back"
  | "book"
  | "browser"
  | "check"
  | "edit"
  | "external"
  | "lock"
  | "note"
  | "pause"
  | "photo"
  | "play"
  | "reset"
  | "rotate"
  | "search"
  | "stop";

type UiIconProps = {
  name: IconName;
  size?: number;
};

const paths: Record<IconName, React.ReactNode> = {
  back: <path d="m9 5-6 6 6 6M3 11h12a6 6 0 0 1 6 6v2" />,
  activity: <path d="M3 12h3l2-5 4 10 3-7 2 2h4" />,
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Zm16 0A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />,
  browser: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  edit: <><path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" /><path d="m13.5 7 3.5 3.5" /></>,
  external: <><path d="M14 4h6v6M20 4 11 13" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  note: <><path d="M5 3h11l3 3v15H5V3Z" /><path d="M15 3v4h4M8 11h8M8 15h8" /></>,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m3 17 5-5 4 4 2-2 7 6" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  reset: <><path d="M4 4v6h6" /><path d="M5.5 17a8 8 0 1 0 1-11L4 10" /></>,
  rotate: <><path d="M20 7v5h-5" /><path d="M18.5 17a8 8 0 1 1 1-9L20 12" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
};

export function UiIcon({ name, size = 18 }: UiIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="ui-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name]}
      </g>
    </svg>
  );
}
