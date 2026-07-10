/* ===== EPHYRA FINANCE — STORAGE MODULE ===== */
const EphyraStorage = (() => {
  const DATA_KEY = 'ephyra_data';
  const USER_KEY = 'ephyra_user';

  const save = (data) => {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
    catch (e) { console.error('Storage save error:', e); }
  };

  const load = () => {
    try { return JSON.parse(localStorage.getItem(DATA_KEY)); }
    catch (e) { return null; }
  };

  const saveUser = (user) => {
    try { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
    catch (e) { console.error('User save error:', e); }
  };

  const loadUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch (e) { return null; }
  };

  const clearAll = () => {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const exportJSON = () => {
    const data = load();
    const user = loadUser();
    return JSON.stringify({ data, user, exportDate: new Date().toISOString(), version: '1.0' }, null, 2);
  };

  const importJSON = (jsonStr) => {
    try {
      const obj = JSON.parse(jsonStr);
      if (obj.data) save(obj.data);
      if (obj.user) saveUser(obj.user);
      return true;
    } catch (e) { return false; }
  };

  return { save, load, saveUser, loadUser, clearAll, exportJSON, importJSON };
})();
