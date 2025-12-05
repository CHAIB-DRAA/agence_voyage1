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

  // ============================================================
  // 1. AUTHENTIFICATION & UTILISATEURS
  // ============================================================
  
  login: async (username, password) => {
    console.log('🔐 [API] login...');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Identifiants incorrects');
      return await response.json(); // { token, username, role }
    } catch (error) {
      console.error("❌ [API] login ERROR :", error.message);
      throw error;
    }
  },

  // Initialisation du premier admin (Seed)
  seed: async () => {
    console.log('🌱 [API] seed requested...');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/seed`);
      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.error || 'Erreur seed');
      }
      return json.message;
    } catch (error) {
      console.error("❌ [API] seed ERROR :", error.message);
      throw error;
    }
  },

  getUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`);
      return await response.json();
    } catch (error) { return []; }
  },

  createUser: async (userData, adminUsername) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // On envoie 'adminUsername' pour prouver qu'on est admin (Sécurité Backend)
        body: JSON.stringify({ ...userData, adminUsername }), 
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur création');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // --- NOUVELLE FONCTION AJOUTÉE ICI ---
  updateUser: async (id, data, adminUsername) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, adminUsername }), 
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur mise à jour');
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  // -------------------------------------

  deleteUser: async (id) => {
    try {
      await fetch(`${API_BASE_URL}/auth/users/${id}`, { method: 'DELETE' });
      return true;
    } catch (error) { return false; }
  },

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