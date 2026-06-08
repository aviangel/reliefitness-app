/**
 * Full-size scroll box for standard (non-FYP) pages. Sits inside the health
 * layout's relative <main>, so only this element scrolls — never the body.
 * Gives native momentum scroll and reserves space for the floating nav.
 */
export function ScrollShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 overflow-y-auto no-scrollbar scroll-touch pb-28 ${className}`}>
      {children}
    </div>
  );
}
