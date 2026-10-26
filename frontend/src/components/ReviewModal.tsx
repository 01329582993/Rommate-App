import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { StarRating } from './StarRating';
import { Avatar, Button, Content, IconButton } from './ui';
import { Theme, type, shadow } from '../theme';
import { saveReview, deleteReview, RATING_LABELS } from '../reviewApi';

interface Props {
  visible: boolean;
  onClose: () => void;
  revieweeId: string;
  revieweeName: string;
  existing?: { id: string; rating: number; comment: string | null } | null;
  onChanged: () => void; // called after a review is saved or deleted
}

const MAX_LENGTH = 500;
const QUICK_TAGS = ['Clean', 'Respectful', 'Quiet', 'Great communicator', 'Reliable', 'Fun to live with'];

export function ReviewModal({ visible, onClose, revieweeId, revieweeName, existing, onChanged }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(existing?.rating ?? 0);
      setComment(existing?.comment ?? '');
    }
  }, [visible, existing]);

  const addTag = (tag: string) => {
    if (comment.toLowerCase().includes(tag.toLowerCase())) return;
    const next = comment.trim() ? `${comment.trim()}, ${tag.toLowerCase()}` : tag;
    setComment(next.slice(0, MAX_LENGTH));
  };

  const submit = async () => {
    if (rating < 1) {
      Alert.alert('Pick a rating', 'Tap the stars to rate your experience.');
      return;
    }
    setBusy(true);
    try {
      const { response, data } = await saveReview(revieweeId, rating, comment);
      if (response.ok) {
        onClose();
        onChanged();
      } else {
        Alert.alert('Could not save review', data?.message || 'Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save review');
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('Delete review?', `This removes your review of ${revieweeName}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const { response, data } = await deleteReview(existing.id);
            if (response.ok) {
              onClose();
              onChanged();
            } else {
              Alert.alert('Could not delete', data?.message || 'Please try again.');
            }
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not delete review');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Text style={type.heading}>{existing ? 'Edit your review' : 'Write a review'}</Text>
            <IconButton onPress={onClose} size={36} label="Close"><X size={18} color={Theme.colors.text} /></IconButton>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Content>
              <View style={styles.person}>
                <Avatar name={revieweeName} size={72} ring />
                <Text style={[type.title, { marginTop: 14, textAlign: 'center' }]}>How was it with {revieweeName.split(' ')[0]}?</Text>
              </View>

              <View style={styles.starsWrap}>
                <StarRating value={rating} size={44} onChange={setRating} />
                <Text style={[styles.label, !rating && { color: Theme.colors.textMuted }]}>{rating ? RATING_LABELS[rating] : 'Tap a star to rate'}</Text>
              </View>

              <Text style={[type.label, { marginBottom: 10 }]}>QUICK TAGS</Text>
              <View style={styles.tags}>
                {QUICK_TAGS.map((t) => (
                  <Pressable key={t} onPress={() => addTag(t)} style={styles.tag}>
                    <Text style={styles.tagText}>+ {t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[type.label, { marginBottom: 10, marginTop: 8 }]}>YOUR EXPERIENCE (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                multiline
                maxLength={MAX_LENGTH}
                value={comment}
                onChangeText={setComment}
                placeholder="Cleanliness, communication, respect for quiet hours..."
                placeholderTextColor={Theme.colors.textMuted}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{comment.length}/{MAX_LENGTH}</Text>

              <Text style={styles.note}>Reviews are visible to other students and show your name. Please keep them honest and respectful.</Text>

              <Button title={existing ? 'Save changes' : 'Post review'} onPress={submit} loading={busy} />
              {existing && <Button title="Delete my review" variant="ghost" onPress={remove} disabled={busy} style={{ marginTop: 8 }} />}
            </Content>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  body: { padding: 20, paddingBottom: 40 },
  person: { alignItems: 'center', marginTop: 6, marginBottom: 20 },
  starsWrap: { alignItems: 'center', backgroundColor: '#fff', borderRadius: Theme.roundness.large, paddingVertical: 24, marginBottom: 24, ...shadow.sm },
  label: { marginTop: 10, fontSize: 16, fontWeight: '800', color: Theme.colors.star },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: Theme.colors.primarySoft },
  tagText: { fontSize: 13, fontWeight: '700', color: Theme.colors.primary },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 18, padding: 16, fontSize: 15, minHeight: 120, color: Theme.colors.text },
  counter: { alignSelf: 'flex-end', marginTop: 6, fontSize: 12, color: Theme.colors.textMuted },
  note: { fontSize: 12, color: Theme.colors.textSecondary, lineHeight: 18, marginVertical: 16 },
});
