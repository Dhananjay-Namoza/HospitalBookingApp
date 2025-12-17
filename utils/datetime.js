
export function formatClock(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export function formatDayHeader(ts) {
  try {
    const d = new Date(ts);
    const today = new Date();
    const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const dd = start(d), tt = start(today);
    const ONE = 24 * 60 * 60 * 1000;
    if (dd === tt) return 'Today';
    if (dd === tt - ONE) return 'Yesterday';
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export function formatChatDate(ts) {
  // kept for any FlatList variant; same as header for now
  return formatDayHeader(ts);
}
