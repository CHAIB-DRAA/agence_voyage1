// src/utils/api.js
import Constants from 'expo-constants';

// Détection automatique de l'IP
const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://10.0.2.2:3000';
};

const API_BASE_URL = getBaseUrl();
console.log('🚀 [API] Cible :', API_BASE_URL);

export default {
  // --- AUTH ---
  login: async (u, p) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({username: u, password: p}) });
    if (!res.ok) throw new Error('Identifiants incorrects');
    return await res.json();
  },
  seed: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/seed`);
    const json = await res.json();
    if(!res.ok) throw new Error(json.error);
    return json.message;
  },
  getUsers: async () => (await fetch(`${API_BASE_URL}/auth/users`)).json(),
  createUser: async (d, a) => {
    const res = await fetch(`${API_BASE_URL}/auth/create`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...d, adminUsername: a}) });
    if(!res.ok) throw new Error((await res.json()).error);
    return await res.json();
  },
  deleteUser: async (id) => { await fetch(`${API_BASE_URL}/auth/users/${id}`, { method: 'DELETE' }); return true; },

  // --- DEVIS (QUOTES) ---
  getQuotes: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/quotes`);
      return res.ok ? await res.json() : [];
    } catch (e) { return []; }
  },
  saveQuote: async (data) => {
    const isEdit = !!data.id;
    const url = `${API_BASE_URL}/quotes${isEdit ? '/' + data.id : ''}`;
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },
  
  // --- NOUVEAU : SUPPRESSION DEVIS ---
  deleteQuote: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/quotes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      return true;
    } catch (error) {
      console.error("❌ [API] deleteQuote:", error);
      throw error;
    }
  },

  // --- HOTELS ---
  getHotels: async () => (await fetch(`${API_BASE_URL}/hotels`)).json(),
  saveHotel: async (d) => {
    const isEdit = !!d.id;
    const res = await fetch(`${API_BASE_URL}/hotels${isEdit ? '/' + d.id : ''}`, { method: isEdit ? 'PUT' : 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d) });
    if(!res.ok) throw new Error('Erreur sauvegarde');
    return await res.json();
  },
  deleteHotel: async (id) => { await fetch(`${API_BASE_URL}/hotels/${id}`, { method: 'DELETE' }); return true; },

  // --- SETTINGS ---
  getSettings: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`);
      const json = await res.json();
      return { destinations: json.destinations||[], periods: json.periods||[], transports: json.transports||[], intercity: json.intercity||[], meals: json.meals||[] };
    } catch(e) { return { destinations: [], periods: [], transports: [], intercity: [], meals: [] }; }
  },
  addSetting: async (c, l, p='0') => (await fetch(`${API_BASE_URL}/settings`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({category: c, label: l, price: p}) })).json(),
  updateSetting: async (id, d) => (await fetch(`${API_BASE_URL}/settings/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d) })).json(),
  deleteSetting: async (id) => { await fetch(`${API_BASE_URL}/settings/${id}`, { method: 'DELETE' }); return true; }
};