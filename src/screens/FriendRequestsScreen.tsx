import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../tokens';
import { useFriendRequests, acceptFriendRequest, removeFriend } from '../hooks/useFriendships';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `há ${min}min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)}d`;
}

export default function FriendRequestsScreen({ navigation }: any) {
  const { requests, loading, reload } = useFriendRequests();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setProcessing(id);
    try { await acceptFriendRequest(id); reload(); }
    catch (e: any) { Alert.alert('Erro', e.message); }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    Alert.alert('Recusar pedido?', 'Deseja recusar este pedido de amizade?', [
      { text: 'Cancelar' },
      { text: 'Recusar', style: 'destructive', onPress: async () => {
        setProcessing(id);
        try { await removeFriend(id); reload(); }
        catch (e: any) { Alert.alert('Erro', e.message); }
        setProcessing(null);
      }},
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.orange} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos de Amizade</Text>
        <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')}>
          <Ionicons name="person-add" size={22} color={colors.orange} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.orange} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const initials = item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const isProcessing = processing === item.id;
            return (
              <View style={styles.row}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
                {isProcessing ? (
                  <ActivityIndicator color={colors.orange} />
                ) : (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                      <Text style={styles.acceptText}>Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                      <Ionicons name="close" size={18} color="#888" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido pendente</Text>}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: fonts.bodyBold, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 0.5, borderBottomColor: '#1A1A1A' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#AAA', fontSize: 15, fontFamily: fonts.bodyBold },
  info: { flex: 1 },
  name: { fontSize: 15, fontFamily: fonts.bodyBold, color: '#FFF' },
  time: { fontSize: 11, fontFamily: fonts.body, color: '#888', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#F2652222', borderWidth: 1, borderColor: '#F26522', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  acceptText: { color: '#F26522', fontSize: 13, fontFamily: fonts.bodyBold },
  rejectBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: '#666', marginTop: 60, fontSize: 14, fontFamily: fonts.body },
});
