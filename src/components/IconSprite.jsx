export default function IconSprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" id="app-icon-sprite" style={{position:'absolute',width:0,height:0,overflow:'hidden'}} aria-hidden="true">
      <defs>
        <symbol id="ico-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-refresh" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0113.657-5.657L18 6M20 12a8 8 0 01-13.657 5.657L6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M18 6v4h-4M6 18v-4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-pencil" viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 000-3L17 4a2.1 2.1 0 00-3 0L4 14v6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M13 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-trash" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></symbol>
        <symbol id="ico-save" viewBox="0 0 24 24"><path d="M5 3h11l3 3v15H5V3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 3v8h8V3M7 21v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-rss" viewBox="0 0 24 24"><path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/></symbol>
        <symbol id="ico-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m16.5 16.5 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-tag" viewBox="0 0 24 24"><path d="M3 6.5V12l9 9 6.5-6.5-9-9H3ZM7 10a1 1 0 100-2 1 1 0 000 2Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-bookmark" viewBox="0 0 24 24"><path d="M5 3h14a1 1 0 011 1v16.5a.5.5 0 01-.75.43L12 17l-7.25 3.93A.5.5 0 014 20.5V4a1 1 0 011-1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-bookmark-fill" viewBox="0 0 24 24"><path d="M5 3h14a1 1 0 011 1v16.5a.5.5 0 01-.75.43L12 17l-7.25 3.93A.5.5 0 014 20.5V4a1 1 0 011-1Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></symbol>
        <symbol id="ico-sort" viewBox="0 0 24 24"><path d="M3 6h18M3 12h12M3 18h6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></symbol>
        <symbol id="ico-sliders" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="6" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/><circle cx="15" cy="12" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="18" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/></symbol>
      </defs>
    </svg>
  )
}

export function SvgIcon({ id, size = 18, className = '' }) {
  return (
    <svg
      className={`svg-ico ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <use href={`#${id}`} />
    </svg>
  )
}
