let version = $state(0);

export function bumpTaskRefresh(): void {
  version++;
}

export function getTaskRefreshVersion(): number {
  return version;
}
