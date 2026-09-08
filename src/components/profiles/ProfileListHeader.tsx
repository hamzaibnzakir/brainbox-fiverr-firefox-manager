export function ProfileListHeader() {
  return (
    <div className="grid grid-cols-[24px_1.3fr_0.9fr_0.7fr_0.5fr_0.9fr_1.3fr_0.9fr_auto] items-center gap-4 border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
      <span></span>
      <span>Profile</span>
      <span>Status</span>
      <span>Proxy IP</span>
      <span>Port</span>
      <span>FF Profile</span>
      <span>Target site</span>
      <span>Last launched</span>
      <span></span>
    </div>
  );
}
