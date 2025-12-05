const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os'); 

// Import des modules locaux
const connectDB = require('./config/db');
const quoteRoutes = require('./routes/quoteRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const authRoutes = require('./routes/authRoutes');
const settingRoutes = require('./routes/settingRoutes');

// Chargement des variables d'environnement
dotenv.config();

// Initialisation de l'application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Log de démarrage
console.log('🔄 [SYSTEM] Initialisation du serveur...');

// Connexion à la Base de Données
connectDB();

// --- VÉRIFICATIONS DE SÉCURITÉ (Pour éviter les crashs silencieux) ---

// 1. Devis
if (!quoteRoutes || (typeof quoteRoutes !== 'function' && typeof quoteRoutes.handle !== 'function')) {
  console.error('\n❌ [ERREUR FATALE] Le fichier routes/quoteRoutes.js est invalide.');
  process.exit(1);
}

// 2. Hôtels
if (!hotelRoutes || (typeof hotelRoutes !== 'function' && typeof hotelRoutes.handle !== 'function')) {
  console.error('\n❌ [ERREUR FATALE] Le fichier routes/hotelRoutes.js est invalide.');
  process.exit(1);
}

// 3. Auth (Ajouté pour la sécurité)
if (!authRoutes || (typeof authRoutes !== 'function' && typeof authRoutes.handle !== 'function')) {
  console.error('\n❌ [ERREUR FATALE] Le fichier routes/authRoutes.js est invalide.');
  process.exit(1);
}

// 4. Settings (Ajouté pour la sécurité)
if (!settingRoutes || (typeof settingRoutes !== 'function' && typeof settingRoutes.handle !== 'function')) {
  console.error('\n❌ [ERREUR FATALE] Le fichier routes/settingRoutes.js est invalide.');
  process.exit(1);
}

// --- DÉFINITION DES ROUTES ---
app.use('/quotes', quoteRoutes);
app.use('/hotels', hotelRoutes);
app.use('/auth', authRoutes);
// ⚠️ CORRECTION ICI : 'settings' au pluriel pour matcher l'API frontend
app.use('/settings', settingRoutes); 

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  let myIp = 'localhost';
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        myIp = iface.address;
      }
    });
  });

  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 URL API : http://${myIp}:${PORT}`);
  console.log(`   👉 Devis:     /quotes`);
  console.log(`   👉 Hôtels:    /hotels`);
  console.log(`   👉 Auth:      /auth`);
  console.log(`   👉 Réglages:  /settings`);
});