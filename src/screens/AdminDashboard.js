import React, { useState, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  SafeAreaView, StatusBar, RefreshControl, Dimensions 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';

const { width } = Dimensions.get('window');

export default function AdminDashboard({ navigation, route }) {
  const [stats, setStats] = useState({
    quotesCount: 0,
    totalRevenue: 0,
    hotelsCount: 0,
    recentQuotes: []
  });
  const [refreshing, setRefreshing] = useState(false);

  // RÉCUPÉRATION DU RÔLE (Sécurité Frontend)
  const currentUsername = route.params?.username || 'utilisateur';
  const userRole = route.params?.userRole || 'user'; // Par défaut 'user' (restreint)
  const isAdmin = userRole === 'admin'; // Booléen pour simplifier les checks

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [allQuotes, hotels] = await Promise.all([
      api.getQuotes(),
      api.getHotels()
    ]);

    // --- FILTRAGE DE SÉCURITÉ ---
    // Si Admin : On garde tout.
    // Si Vendeur : On ne garde que les devis créés par lui (champ 'createdBy')
    const myQuotes = isAdmin 
      ? allQuotes 
      : allQuotes.filter(q => q.createdBy === currentUsername);

    const totalRev = myQuotes.reduce((acc, q) => acc + (parseInt(q.totalAmount) || 0), 0);
    
    setStats({
      quotesCount: myQuotes.length,
      totalRevenue: totalRev,
      hotelsCount: hotels.length,
      recentQuotes: myQuotes.slice(0, 5)
    });
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const StatCard = ({ title, value, icon, color, isCurrency }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={[styles.statValue, { color: color }]}>
          {isCurrency ? value.toLocaleString() + ' DA' : value}
        </Text>
      </View>
    </View>
  );

  const MenuButton = ({ title, subtitle, icon, target, params, color, disabled }) => (
    <TouchableOpacity 
      style={[styles.menuBtn, disabled && {opacity: 0.5}]} 
      onPress={() => !disabled && navigation.navigate(target, params)}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={[styles.menuIcon, { backgroundColor: disabled ? '#ccc' : color }]}>
        <Feather name={icon} size={24} color="#050B14" />
      </View>
      <View style={styles.menuTextContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{subtitle}</Text>
      </View>
      {!disabled && <Feather name="chevron-left" size={24} color="#556" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050B14" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>لوحة القيادة</Text>
          <Text style={styles.headerSub}>
            Bienvenue {currentUsername} 
            <Text style={{color: isAdmin ? '#E67E22' : '#3498DB'}}> ({isAdmin ? 'Admin' : 'Vendeur'})</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3C764" />}
      >
        {/* STATS (Adaptées au rôle) */}
        <Text style={styles.sectionTitle}>
          {isAdmin ? 'نظرة عامة (Global)' : 'أدائي (Mes Stats)'}
        </Text>
        <View style={styles.statsGrid}>
          <StatCard title="إجمالي العروض" value={stats.quotesCount} icon="file-text" color="#3498DB" />
          {isAdmin && <StatCard title="الفنادق المسجلة" value={stats.hotelsCount} icon="home" color="#9B59B6" />}
          
          <View style={{width: '100%', marginTop: 10}}>
            <StatCard title="إجمالي المبيعات (Estimé)" value={stats.totalRevenue} icon="pie-chart" color="#2ECC71" isCurrency />
          </View>
        </View>

        <Text style={[styles.sectionTitle, {marginTop: 30}]}>الإدارة (Gestion)</Text>
        
        {/* GESTION UTILISATEURS : Réservé aux Admins */}
        {isAdmin && (
          <MenuButton 
          title="إنشاء عرض جديد" // Nouveau Devis
          subtitle="Créer un devis pour un client" 
          icon="plus-circle" 
          target="AddEdit" // On va vers l'écran de création
          params={{ username: currentUsername }} // <--- CRUCIAL : On passe le nom de l'agence
          color="#2ECC71" // Vert pour l'action positive
        />
        )}

        {/* GESTION HÔTELS : Lecture seule pour vendeurs */}
        <MenuButton 
          title="قائمة الفنادق & الأسعار" 
          subtitle={isAdmin ? "Ajouter, modifier les prix" : "Consulter les tarifs uniquement"} 
          icon="home" 
          target="AdminHotels"
          params={{ userRole: userRole }} 
          color="#F3C764" 
        />

        {/* PARAMÈTRES : Réservé aux Admins */}
        {isAdmin && (
          <MenuButton 
            title="إعدادات عامة" 
            subtitle="Destinations, Saisons, Transports" 
            icon="settings" 
            target="AdminSettings" 
            color="#E67E22" 
          />
        )}

        {/* ARCHIVES : Filtrées pour le vendeur */}
        <MenuButton 
          title="أرشيف العروض" 
          subtitle={isAdmin ? "Tous les devis de l'agence" : "Mes devis uniquement"} 
          icon="list" 
          target="List" 
          // On passe le filtre à l'écran suivant
          params={{ filterUser: isAdmin ? null : currentUsername }} 
          color="#3498DB" 
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 15, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'right' },
  headerSub: { fontSize: 14, color: '#8A95A5', textAlign: 'right' },
  logoutBtn: { padding: 10, backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: 12 },
  content: { padding: 20 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'right' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { backgroundColor: '#101A2D', width: (width - 50) / 2, padding: 15, borderRadius: 16, borderLeftWidth: 4, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  iconBox: { padding: 10, borderRadius: 10 },
  statLabel: { color: '#8A95A5', fontSize: 12, marginBottom: 4, textAlign: 'right' },
  statValue: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
  menuBtn: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#101A2D', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  menuIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  menuTextContent: { flex: 1 },
  menuTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  menuSub: { color: '#8A95A5', fontSize: 12, marginTop: 2, textAlign: 'right' }
});