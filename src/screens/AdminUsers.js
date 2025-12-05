import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, 
  SafeAreaView, StatusBar, Alert, Modal, ActivityIndicator, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../utils/api';

export default function AdminUsers({ route, navigation }) {
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // États pour nouveau user
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isNewAdmin, setIsNewAdmin] = useState(false); // Rôle
  
  // On récupère le nom de l'admin connecté pour prouver notre identité au serveur
  const currentAdmin = route.params?.username || 'admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await api.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) {
      Alert.alert('Erreur', 'Remplissez tous les champs');
      return;
    }
    try {
      await api.createUser(
        { 
          username: newUsername, 
          password: newPassword, 
          role: isNewAdmin ? 'admin' : 'user' 
        }, 
        currentAdmin // Clé de sécurité envoyée au backend
      );
      setModalVisible(false);
      setNewUsername('');
      setNewPassword('');
      setIsNewAdmin(false);
      loadUsers();
      Alert.alert('Succès', `Compte ${isNewAdmin ? 'Admin' : 'Agence'} créé !`);
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleDelete = (id, username) => {
    if (username === 'admin') {
      Alert.alert('Interdit', 'Impossible de supprimer le Super Admin principal.');
      return;
    }
    Alert.alert("Supprimer ?", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
          await api.deleteUser(id);
          loadUsers();
        }}
    ]);
  };

  const renderItem = ({ item }) => {
    const isAdmin = item.role === 'admin';
    return (
      <View style={[styles.card, isAdmin ? styles.cardAdmin : styles.cardUser]}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <View style={[styles.avatar, isAdmin ? styles.avatarAdmin : styles.avatarUser]}>
            <Feather name={isAdmin ? 'shield' : 'briefcase'} size={20} color="#FFF" />
          </View>
          <View style={{marginLeft: 15}}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={[styles.role, {color: isAdmin ? '#E67E22' : '#3498DB'}]}>
              {isAdmin ? 'Administrateur' : 'Agence / Vendeur'}
            </Text>
          </View>
        </View>
        {item.username !== 'admin' && (
          <TouchableOpacity onPress={() => handleDelete(item._id || item.id, item.username)} style={styles.deleteBtn}>
            <Feather name="trash-2" size={20} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050B14" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-right" size={24} color="#F3C764" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion des Accès</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Feather name="user-plus" size={24} color="#050B14" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={users} 
        renderItem={renderItem} 
        keyExtractor={item => item._id || item.id} 
        contentContainerStyle={{padding:20}} 
        refreshing={loading}
        onRefresh={loadUsers}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>}
      />

      {/* MODAL CRÉATION */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvel Utilisateur</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Identifiant (Nom Agence)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: agence_oran" 
              placeholderTextColor="#666" 
              value={newUsername} 
              onChangeText={setNewUsername} 
              autoCapitalize="none" 
              textAlign="right"
            />
            
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Mot de passe secret" 
              placeholderTextColor="#666" 
              value={newPassword} 
              onChangeText={setNewPassword} 
              secureTextEntry 
              textAlign="right"
            />

            {/* SÉLECTEUR DE RÔLE */}
            <TouchableOpacity 
              style={[styles.roleSelector, isNewAdmin && styles.roleSelectorActive]} 
              onPress={() => setIsNewAdmin(!isNewAdmin)} 
              activeOpacity={0.8}
            >
              <View>
                <Text style={[styles.roleTitle, isNewAdmin && {color:'#050B14'}]}>Accès Administrateur</Text>
                <Text style={[styles.roleDesc, isNewAdmin && {color:'#050B14'}]}>Peut modifier les prix et les hôtels.</Text>
              </View>
              <Feather name={isNewAdmin ? "check-circle" : "circle"} size={24} color={isNewAdmin ? "#050B14" : "#666"} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleAddUser} style={styles.saveBtn}>
              <Text style={styles.saveText}>Créer le compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth:1, borderColor:'#222' },
  headerTitle: { color: '#F3C764', fontSize: 20, fontWeight:'bold' },
  backButton: { padding: 8 },
  addButton: { backgroundColor: '#F3C764', padding: 8, borderRadius: 8 },
  
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },

  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#101A2D', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardAdmin: { borderColor: 'rgba(230, 126, 34, 0.3)' },
  cardUser: { borderColor: 'rgba(52, 152, 219, 0.3)' },
  
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarAdmin: { backgroundColor: 'rgba(230, 126, 34, 0.2)' },
  avatarUser: { backgroundColor: 'rgba(52, 152, 219, 0.2)' },
  
  username: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'left' },
  role: { fontSize: 12, marginTop: 2, textAlign: 'left' },
  deleteBtn: { padding: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#101A2D', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight:'bold' },
  
  label: { color: '#8A95A5', marginBottom: 8, textAlign: 'right', fontSize: 12 },
  input: { backgroundColor: '#050B14', color: '#FFF', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth:1, borderColor:'#333', fontSize: 16 },
  
  roleSelector: { flexDirection: 'row', justifyContent:'space-between', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#333', backgroundColor: '#050B14' },
  roleSelectorActive: { backgroundColor: '#F3C764', borderColor: '#F3C764' },
  roleTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  roleDesc: { color: '#666', fontSize: 11, marginTop: 2 },

  saveBtn: { backgroundColor: '#F3C764', padding: 16, alignItems: 'center', borderRadius: 12 },
  saveText: { color: '#050B14', fontWeight: 'bold', fontSize: 16 }
});