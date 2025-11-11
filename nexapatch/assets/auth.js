// Minimal role-aware auth helper for NexaPatch
// Stores user from query params and enforces page-level access.

(function () {
  function parseQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const out = {};
      for (const [k, v] of params.entries()) out[k] = v;
      return out;
    } catch {
      return {};
    }
  }

  function saveUserFromQuery() {
    const q = parseQuery();
    if (!q || (!q.id && !q.username)) return;
    const user = {
      id: q.id || '',
      username: q.username || '',
      avatar: q.avatar || '',
      guilds: q.guilds ? Number(q.guilds) : undefined,
      ts: Date.now()
    };
    try {
      localStorage.setItem('nexapatch.user', JSON.stringify(user));
    } catch {}
  }

  function getUser() {
    try {
      const raw = localStorage.getItem('nexapatch.user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function isAdmin(user) {
    if (!user || !user.id) return false;
    const admins = Array.isArray(window.NEXAPATCH_ADMIN_IDS)
      ? window.NEXAPATCH_ADMIN_IDS
      : [];
    return admins.includes(user.id);
  }

  function enforceRole(opts) {
    const { requireAdmin = false, redirectTo } = opts || {};
    const user = getUser();
    if (!user) return; // allow loading; upstream flows should attach user
    if (requireAdmin && !isAdmin(user) && redirectTo) {
      // Preserve known user params on redirect for continuity
      const qp = new URLSearchParams({
        id: user.id || '',
        username: user.username || ''
      });
      window.location.replace(`${redirectTo}?${qp.toString()}`);
    }
  }

  // Expose minimal API
  window.NexaPatchAuth = {
    saveUserFromQuery,
    getUser,
    isAdmin,
    enforceRole
  };

  // Auto-run on load to capture query user
  try { saveUserFromQuery(); } catch {}
})();

