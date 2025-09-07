import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, PanResponder, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Glass from './Glass';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateSpotCloud, deleteSpotCloud } from '../services/cloudStorage';

type Params = { spotId: string; name?: string; radiusMiles: number };

export default function EditSpotScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { spotId, name: initialName = '', radiusMiles: initialRadius = 0.3 } = (route.params || {}) as Params;

  const [name, setName] = useState(initialName);
  const [radiusMiles, setRadiusMiles] = useState(initialRadius);

  const [sliderWidth, setSliderWidth] = useState(0);
  const MIN_RADIUS = 0.1;
  const MAX_RADIUS = 2;
  const STEP_RADIUS = 0.1;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const roundToStep = (n: number, step: number) => Math.round(n / step) * step;
  const progress = clamp((radiusMiles - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS), 0, 1);
  const thumbLeft = sliderWidth > 0 ? progress * sliderWidth : 0;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = clamp(evt.nativeEvent.locationX, 0, sliderWidth || 1);
          const p = x / (sliderWidth || 1);
          const val = roundToStep(MIN_RADIUS + p * (MAX_RADIUS - MIN_RADIUS), STEP_RADIUS);
          setRadiusMiles(clamp(Number(val.toFixed(2)), MIN_RADIUS, MAX_RADIUS));
        },
        onPanResponderMove: (evt) => {
          const x = clamp(evt.nativeEvent.locationX, 0, sliderWidth || 1);
          const p = x / (sliderWidth || 1);
          const val = roundToStep(MIN_RADIUS + p * (MAX_RADIUS - MIN_RADIUS), STEP_RADIUS);
          setRadiusMiles(clamp(Number(val.toFixed(2)), MIN_RADIUS, MAX_RADIUS));
        },
      }),
    [sliderWidth]
  );

  const onSave = async () => {
    await updateSpotCloud(spotId, { name: name.trim() || undefined, radiusMiles });
    navigation.goBack();
  };

  const onDelete = async () => {
    Alert.alert('Delete Spot', 'Are you sure you want to delete this spot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteSpotCloud(spotId); navigation.goBack(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', left: 16, top: insets.top + 24, zIndex: 10, padding: 6 }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>←</Text>
      </TouchableOpacity>
      <View style={{ height: insets.top + 56 }} />
      <Glass style={styles.card}>
        <Text style={styles.title}>Edit Spot</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name (optional)"
          placeholderTextColor="#71717a"
          style={styles.input}
        />

        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Radius: {radiusMiles.toFixed(1)} mi</Text>
          <View style={styles.sliderContainer} onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)} {...panResponder.panHandlers}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: thumbLeft }]} />
              <View style={[styles.sliderThumb, { left: Math.max(-10, Math.min((sliderWidth || 0) - 10, thumbLeft - 10)) }]} />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={[styles.btn, { opacity: 0 }]} />
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onSave}>
            <Text style={styles.btnPrimaryText}>Save</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.deleteBtn]} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete Spot</Text>
        </TouchableOpacity>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, padding: 16, borderRadius: 16 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, paddingHorizontal: 12 },
  label: { color: colors.textSecondary },
  sliderContainer: { marginTop: 10, height: 28, justifyContent: 'center' },
  sliderTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' },
  sliderFill: { height: 4, backgroundColor: colors.accent },
  sliderThumb: { position: 'absolute', top: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  btnGhost: { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  btnGhostText: { color: colors.textPrimary, fontWeight: '700' },
  btnPrimary: { borderColor: '#0A84FF', backgroundColor: '#0A84FF' },
  btnPrimaryText: { color: '#ffffff', fontWeight: '800' },
  deleteBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  deleteText: { color: '#ff4545', fontWeight: '800' },
});


