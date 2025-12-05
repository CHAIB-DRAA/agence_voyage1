const User = require('../models/User');

// 1. LOGIN : Connexion classique
exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log(`🔐 [AUTH] Tentative de connexion : ${username}`);

  try {
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      console.log('❌ [AUTH] Echec connexion');
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    console.log(`✅ [AUTH] Connexion réussie (${user.role})`);
    // On renvoie le rôle pour que l'appli sache quelles pages afficher
    res.json({ 
      token: 'fake-jwt-token-' + user._id, 
      username: user.username,
      role: user.role 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. SEED : Création du PREMIER et UNIQUE Admin initial
// Cette route se verrouille automatiquement dès qu'un utilisateur existe.
exports.seedAdmin = async (req, res) => {
  try {
    const count = await User.countDocuments();
    
    if (count > 0) {
      return res.status(403).json({ error: "L'initialisation a déjà été faite. Impossible de recréer un admin." });
    }

    const admin = new User({ 
      username: 'admin', 
      password: '123', // À changer immédiatement
      role: 'admin' 
    }); 
    
    await admin.save();
    console.log('👑 [AUTH] Super Admin créé via Seed');
    res.json({ message: "Super Admin créé : admin / 123" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. CREATE USER : Ajout d'utilisateurs (Réservé aux Admins)
exports.createUser = async (req, res) => {
  // On attend 'adminUsername' dans le corps de la requête pour vérifier l'autorité
  const { username, password, role, adminUsername } = req.body; 
  
  console.log(`👤 [AUTH] Création utilisateur demandée par ${adminUsername}`);

  try {
    // A. VÉRIFICATION DE SÉCURITÉ (Backend Enforcement)
    // On vérifie si celui qui demande est bien un admin en base
    const requester = await User.findOne({ username: adminUsername });
    
    if (!requester || requester.role !== 'admin') {
      console.log('⛔ [AUTH] Tentative non autorisée');
      return res.status(403).json({ error: "Accès refusé. Seul un admin peut créer des utilisateurs." });
    }

    // B. Création
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: "Ce nom d'utilisateur existe déjà." });

    const newUser = new User({ username, password, role: role || 'user' });
    await newUser.save();
    
    console.log(`✅ [AUTH] Nouvel utilisateur créé : ${username} (${role})`);
    res.json({ message: "Utilisateur créé avec succès", user: { username, role } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. GET USERS : Lister les utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ role: 1 }); // Tri par rôle
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};