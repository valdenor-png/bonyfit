import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../tokens';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useFriendshipStatus, sendFriendRequest, acceptFriendRequest } from '../hooks/useFriendships';

interface SearchResult {
  id: string;
  name: string;
  avatar_url: string | null;
  level: string;
}

function UserRow({ item, myId, onAction }: { item: SearchResult; myId: string; onAction: () => void }) {
  const { status, friendshipId } = useFriendshipStatus(item.id);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (status === 'none') await sendFriendRequest(item.id);
      else if (status === 'pending_received' && friendshipId) await acceptFriendRequest(friendshipId);
      onAction();
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
    setLoading(false);
  };

  const btnLabel = status === 'none' ? 'Adicionar' : status === 'pending_sent' ? 'Pendente' : status === 'pending_received' ? 'Aceitar' : status === 'accepted' ? 'Amigos ✓' : '';
  const btnColor = status === 'none' ? colors.orange : status === 'accepted' ? '#22C55E' : '#666';
  const disabled = status === 'pending_sent' || status === 'accepted' || loading;

  const initials = item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.row}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.level}>{item.level}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: `${btnColor}22`, borderColor: btnColor }]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {loading ? <ActivityIndicator size="small" color={btnColor} /> : <Text style={[styles.actionText, { color: btnColor }]}>{btnLabel}</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function FriendSearchScreen({ navigation }: any) {
  const user = useAuth((s) => s.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const search = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('public_user_profile')
      .select('id, name, avatar_url, level')
      .ilike('name', `%${text.trim()}%`)
      .neq('id', user?.id)
      .limit(20);
    setResults(data ?? []);
    setSearching(false);
  }, [user?.id]);

  // Debounce
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = (text: string) => {
    setQuery(text);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => search(text), 300));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar Amigos</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleChange}
          placeholder="Buscar por nome..."
          placeholderTextColor="#555"
          autoFocus
          maxLength={50}
        />
      </View>

      {searching && <ActivityIndicator color={colors.orange} style={{ marginTop: 20 }} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserRow item={item} myId={user?.id ?? ''} onAction={() => setRefreshKey(k => k + 1)} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={query.length >= 2 && !searching ? <Text style={styles.empty}>Nenhum resultado</Text> : null}
        extraData={refreshKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, height: 44, color: '#FFF', fontSize: 14, fontFamily: fonts.body },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#AAA', fontSize: 14, fontFamily: fonts.bodyBold },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: fonts.bodyBold, color: '#FFF' },
  level: { fontSize: 11, fontFamily: fonts.body, color: '#888' },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontFamily: fonts.bodyBold },
  empty: { textAlign: 'center', color: '#666', marginTop: 40, fontSize: 13, fontFamily: fonts.body },
});
