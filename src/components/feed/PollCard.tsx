import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { fonts } from '../../tokens';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  poll: {
    id: string;
    author_name: string;
    question: string;
    option_a: string;
    option_b: string;
    expires_at: string;
    created_at: string;
  };
}

export default function PollCard({ poll }: Props) {
  const user = useAuth((s) => s.user);
  const [myVote, setMyVote] = useState<'a' | 'b' | null>(null);
  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);
  const [voting, setVoting] = useState(false);

  const expired = new Date(poll.expires_at) < new Date();
  const total = countA + countB;
  const pctA = total > 0 ? Math.round((countA / total) * 100) : 0;
  const pctB = total > 0 ? Math.round((countB / total) * 100) : 0;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('poll_votes')
        .select('chosen_option, user_id')
        .eq('poll_id', poll.id);

      const votes = data ?? [];
      setCountA(votes.filter(v => v.chosen_option === 'a').length);
      setCountB(votes.filter(v => v.chosen_option === 'b').length);
      const mine = votes.find(v => v.user_id === user?.id);
      if (mine) setMyVote(mine.chosen_option as 'a' | 'b');
    })();
  }, [poll.id, user?.id]);

  const handleVote = async (option: 'a' | 'b') => {
    if (myVote || expired || voting) return;
    setVoting(true);
    const { error } = await supabase.from('poll_votes').insert({
      poll_id: poll.id,
      user_id: user?.id,
      chosen_option: option,
    });
    if (!error) {
      setMyVote(option);
      if (option === 'a') setCountA(c => c + 1);
      else setCountB(c => c + 1);
    }
    setVoting(false);
  };

  const timeLeft = () => {
    const diff = new Date(poll.expires_at).getTime() - Date.now();
    if (diff <= 0) return 'Encerrada';
    const hrs = Math.floor(diff / 3600000);
    if (hrs > 0) return `${hrs}h restam`;
    return `${Math.floor(diff / 60000)}min restam`;
  };

  const showResults = myVote !== null || expired;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.author}>{poll.author_name}</Text>
        <Text style={styles.time}>{showResults ? `${total} votos` : timeLeft()}</Text>
      </View>

      <Text style={styles.question}>{poll.question}</Text>

      {!showResults ? (
        <View style={styles.options}>
          <TouchableOpacity style={styles.optionBtn} onPress={() => handleVote('a')} activeOpacity={0.7} disabled={voting}>
            <Text style={styles.optionText}>{poll.option_a}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={() => handleVote('b')} activeOpacity={0.7} disabled={voting}>
            <Text style={styles.optionText}>{poll.option_b}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.results}>
          <View style={styles.resultRow}>
            <View style={[styles.resultBar, { width: `${pctA}%` }, pctA >= pctB && styles.resultBarWinner]} />
            <Text style={styles.resultLabel}>{poll.option_a}</Text>
            <Text style={styles.resultPct}>{pctA}%</Text>
          </View>
          <View style={styles.resultRow}>
            <View style={[styles.resultBar, { width: `${pctB}%` }, pctB > pctA && styles.resultBarWinner]} />
            <Text style={styles.resultLabel}>{poll.option_b}</Text>
            <Text style={styles.resultPct}>{pctB}%</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  author: { fontSize: 13, fontFamily: fonts.bodyBold, color: '#FFF' },
  time: { fontSize: 11, fontFamily: fonts.body, color: 'rgba(255,255,255,0.5)' },
  question: { fontSize: 16, fontFamily: fonts.bodyBold, color: '#FFF', marginBottom: 14 },
  options: { gap: 8 },
  optionBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  optionText: { fontSize: 15, fontFamily: fonts.bodyBold, color: '#FFF' },
  results: { gap: 8 },
  resultRow: { height: 40, borderRadius: 10, backgroundColor: '#222', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  resultBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#666', borderRadius: 10 },
  resultBarWinner: { backgroundColor: '#F26522' },
  resultLabel: { fontSize: 14, fontFamily: fonts.bodyBold, color: '#FFF', flex: 1, zIndex: 1 },
  resultPct: { fontSize: 14, fontFamily: fonts.numbersBold, color: '#FFF', zIndex: 1 },
});
