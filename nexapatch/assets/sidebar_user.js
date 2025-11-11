// Replace sidebar status with Discord user avatar + username
(function(){
  function getUser(){
    try {
      if (window.NexaPatchAuth && typeof window.NexaPatchAuth.getUser === 'function') {
        const u = window.NexaPatchAuth.getUser();
        if (u) return u;
      }
    } catch {}
    try {
      const raw = localStorage.getItem('nexapatch.user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function avatarUrl(u){
    if (u && u.id && u.avatar) {
      return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64`;
    }
    // Fallback generic avatar
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  function buildLoginUrl() {
    // Fixed OAuth URL provided by the app owner
    // Include state=select to return users to server selection after auth
    return 'https://discord.com/oauth2/authorize?client_id=1401728693017120899&response_type=code&redirect_uri=https%3A%2F%2Fnexa-core.net%2Fapi%2Fdiscord-callback-nexapatch&scope=guilds+identify&state=select';
  }

  function render(){
    const u = getUser();
    const root = document.querySelector('.sidebar-footer');
    if (!root) return;
    if (!u || !u.username) {
      const loginUrl = buildLoginUrl();
      root.innerHTML = `
        <img class="sidebar-discord-icon" src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/discord.svg" alt="Discord" />
        <a class="sidebar-signin" href="${loginUrl}">Sign in</a>
      `;
      root.classList.add('sidebar-user');
      return;
    }
    root.innerHTML = `
      <img class="sidebar-user-avatar" src="${avatarUrl(u)}" alt="${u.username}'s avatar" />
      <div class="sidebar-user-text">
        <div class="username">${u.username}</div>
        <small>Discord</small>
      </div>
    `;
    root.classList.add('sidebar-user');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
