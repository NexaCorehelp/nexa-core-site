// NexaPatch server context helper
// Minimal, client-side only for now. Replace list fetch with API later.
(function(){
  const KEY = 'nexapatch.server';

  function getServers(){
    // TODO: Replace with API call to fetch user-linked servers
    return [
      { id: 'liberty-main', name: 'Liberty County RP — Main', region: 'EU' },
      { id: 'state-training', name: 'State RP — Training', region: 'US' }
    ];
  }

  function setSelectedServer(serverId){
    try { localStorage.setItem(KEY, serverId || ''); } catch {}
  }

  function getSelectedServer(){
    try { return localStorage.getItem(KEY) || ''; } catch { return ''; }
  }

  function ensureServerOrRedirect(redirectTo){
    const id = getSelectedServer();
    if (!id && redirectTo) {
      window.location.replace(redirectTo);
      return false;
    }
    return true;
  }

  function bindSelect(selectEl){
    if (!selectEl) return;
    const servers = getServers();
    selectEl.innerHTML = '';
    for (const s of servers){
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      selectEl.appendChild(opt);
    }
    const current = getSelectedServer();
    if (current) selectEl.value = current;
    selectEl.addEventListener('change', ()=>{
      setSelectedServer(selectEl.value);
    });
  }

  window.NexaPatchContext = {
    getServers,
    setSelectedServer,
    getSelectedServer,
    ensureServerOrRedirect,
    bindSelect
  };
})();

