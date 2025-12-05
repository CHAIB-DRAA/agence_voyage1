import React, { useState, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, FlatList, StyleSheet, 
  SafeAreaView, StatusBar, TextInput, ActivityIndicator, 
  RefreshControl, Keyboard, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';

export default function QuotesList({ navigation, route }) {
  const [allQuotes, setAllQuotes] = useState([]);
  const [displayedQuotes, setDisplayedQuotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { filterUser, userRole } = route.params || {};
  const isAdmin = userRole === 'admin';

  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [filterUser, userRole])
  );

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const data = await api.getQuotes();
      let safeData = Array.isArray(data) ? data : [];
      
      if (!isAdmin && filterUser) {
        safeData = safeData.filter(q => q.createdBy === filterUser || !q.createdBy);
      }
      
      setAllQuotes(safeData);
      
      if (searchQuery) {
        filterData(searchQuery, safeData);
      } else {
        setDisplayedQuotes(safeData);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotes();
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Supprimer le devis ?",
      "Cette action est définitive.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
            try {
              await api.deleteQuote(id);
              loadQuotes();
            } catch (e) {
              Alert.alert("Erreur", "Impossible de supprimer.");
            }
          } 
        }
      ]
    );
  };

  const handleEdit = (item) => {
    navigation.navigate('AddEdit', { 
      edit: true, 
      quote: item,
      username: filterUser, 
      userRole: userRole 
    });
  };

  const handleDetails = (item) => {
    navigation.navigate('Details', { 
      quote: item,
      userRole: userRole,
      username: filterUser
    });
  };

  const filterData = (text, sourceData = allQuotes) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setDisplayedQuotes(sourceData);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = sourceData.filter(item => {
        const dest = item.destination ? item.destination.toLowerCase() : '';
        const client = item.clientName ? item.clientName.toLowerCase() : '';
        const creator = item.createdBy ? item.createdBy.toLowerCase() : '';
        return dest.includes(lowerText) || client.includes(lowerText) || creator.includes(lowerText);
      });
      setDisplayedQuotes(filtered);
    }
  };

  // --- GESTION DES COULEURS SELON LE STATUT ---
  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { 
          bg: 'rgba(46, 204, 113, 0.15)', // Vert sombre transparent
          border: '#2ECC71', 
          icon: 'check-circle',
          label: 'مؤكد (Confirmé)'
        };
      case 'cancelled':
        return { 
          bg: 'rgba(231, 76, 60, 0.15)', // Rouge sombre transparent
          border: '#E74C3C', 
          icon: 'x-circle',
          label: 'ملغى (Annulé)'
        };
      default: // pending
        return { 
          bg: '#101A2D', // Bleu nuit standard
          border: 'rgba(255,255,255,0.05)', 
          icon: 'clock',
          label: 'في الانتظار (En cours)'
        };
    }
  };

  const renderItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={[styles.cardContainer, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, borderWidth: 1 }]}>
        
        <TouchableOpacity 
          style={styles.cardMainArea} 
          onPress={() => handleDetails(item)}
          activeOpacity={0.7}
        >
          {/* En-tête avec Date et Statut */}
          <View style={styles.cardHeader}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Text style={[styles.statusLabel, {color: statusStyle.border}]}>{statusStyle.label}</Text>
              <Feather name={statusStyle.icon} size={14} color={statusStyle.border} style={{marginLeft: 4}} />
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
          </View>

          <Text style={styles.destination} numberOfLines={1}>{item.destination || '---'}</Text>

          <View style={styles.clientRow}>
            <Text style={styles.clientName}>
              {item.clientName || 'Client Inconnu'} 
              {isAdmin && item.createdBy ? <Text style={styles.creatorLabel}> (par {item.createdBy})</Text> : null}
            </Text>
            <Feather name="user" size={14} color="#8A95A5" style={{marginLeft: 5}} />
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{item.totalAmount ? item.totalAmount + ' DA' : '0 DA'}</Text>
            </View>
            <View style={{flexDirection:'row', alignItems:'center'}}>
               <Text style={styles.subText}>{item.nightsMakkah || 0} مكة • {item.nightsMedina || 0} المدينة</Text>
               <Feather name="chevron-left" size={16} color="#556" style={{marginLeft:5}}/>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionBar}>
          <TouchableOpacity onPress={() => handleDelete(item.id || item._id)} style={styles.actionBtnDelete}>
            <Feather name="trash-2" size={18} color="#E74C3C" />
            <Text style={[styles.actionText, {color: '#E74C3C'}]}>حذف</Text>
          </TouchableOpacity>
          
          <View style={styles.verticalDivider} />
          
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtnEdit}>
            <Feather name="edit-3" size={18} color="#F3C764" />
            <Text style={[styles.actionText, {color: '#F3C764'}]}>تعديل</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050B14" />
      
      <View style={styles.headerContainer}>
        <View style={styles.topBar}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color="#F3C764" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {filterUser ? 'عروضي' : 'أرشيف العروض'}
          </Text>
        </View>

        <View style={styles.searchBarContainer}>
          <Feather name="search" size={20} color="#8A95A5" style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث..."
            placeholderTextColor="#556"
            value={searchQuery}
            onChangeText={(text) => filterData(text)}
            textAlign="right" 
          />
        </View>
      </View>

      <FlatList 
        data={displayedQuotes} 
        keyExtractor={item => item.id || item._id || Math.random().toString()} 
        renderItem={renderItem} 
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F3C764" />}
        ListEmptyComponent={!loading && (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={50} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>القائمة فارغة</Text>
          </View>
        )}
      />

      {loading && !refreshing && <View style={styles.loaderCenter}><ActivityIndicator size="large" color="#F3C764" /></View>}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddEdit', { username: filterUser, userRole })}
      >
        <Feather name="plus" size={32} color="#050B14" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14' },
  headerContainer: { backgroundColor: '#050B14', paddingBottom: 15, paddingTop: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  topBar: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  headerTitle: { flex: 1, color: '#F3C764', fontSize: 22, fontWeight: '800', textAlign: 'center', marginRight: -30 },
  backBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  searchBarContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#101A2D', borderRadius: 12, paddingHorizontal: 12, height: 46, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, marginRight: 10, height: '100%' },
  listContent: { padding: 20, paddingBottom: 100 },
  
  cardContainer: { borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  
  cardMainArea: { padding: 16 },

  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%', marginBottom: 8, alignItems: 'center' },
  destination: { color: '#FFF', fontSize: 18, fontWeight: '700', textAlign: 'right', marginBottom: 5 },
  date: { color: '#556', fontSize: 12 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  
  clientRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 8 },
  clientName: { color: '#AAA', fontSize: 14 },
  creatorLabel: { color: '#E67E22', fontSize: 11, fontStyle: 'italic' },

  detailsRow: { flexDirection: 'row-reverse', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginTop: 5 },
  subText: { color: '#8A95A5', fontSize: 13, textAlign: 'right' },
  priceBadge: { backgroundColor: 'rgba(243, 199, 100, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  priceText: { color: '#F3C764', fontSize: 14, fontWeight: '700' },

  actionBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' },
  actionBtnEdit: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  actionBtnDelete: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
  actionText: { marginLeft: 8, fontWeight: '600', fontSize: 14 },
  verticalDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { color: '#666', fontSize: 18, fontWeight: '700', marginTop: 10 },
  emptySub: { color: '#444', marginTop: 5 },
  loaderCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(5,11,20,0.5)' },
  fab: { position: 'absolute', bottom: 30, left: 30, width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3C764', alignItems: 'center', justifyContent: 'center', shadowColor: '#F3C764', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});