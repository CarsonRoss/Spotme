import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, PanResponder } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { colors } from '../theme/colors';
import Glass from './Glass';
import { getCurrentLocation } from '../services/locationService';
import * as ExpoLocation from 'expo-location';
import { addSpotCloud } from '../services/cloudStorage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AddSpotScreenProps = {
  embedded?: boolean;
  onDone?: (data: { radiusMiles: number }) => void;
  onBack?: () => void;
};

export default function AddSpotScreen({ embedded = false, onDone, onBack }: AddSpotScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number>(0.3);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const mapRef = useRef<MapView | null>(null);
  const [address, setAddress] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([]);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [sliderWidth, setSliderWidth] = useState(0);

  const MIN_RADIUS = 0.1;
  const MAX_RADIUS = 2;
  const STEP_RADIUS = 0.1;
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const roundToStep = (n: number, step: number) => Math.round(n / step) * step;
  const progress = clamp((radiusMiles - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS), 0, 1);
  const thumbLeft = sliderWidth > 0 ? progress * sliderWidth : 0;

  const panResponder = React.useMemo(
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

  useEffect(() => {
    (async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          setMapRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        } else {
          // fallback to a default region (SF)
          setMapRegion({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedCoord({ latitude, longitude });
    animateToCenterWithRadius({ latitude, longitude });
  };

  const MI_TO_METERS = 1609.34;
  const animateToCenterWithRadius = (center: { latitude: number; longitude: number }) => {
    // Compute deltas to fit the radius circle
    const radiusMeters = radiusMiles * MI_TO_METERS;
    const lat = center.latitude;
    const metersPerDegLon = 111320 * Math.max(0.00001, Math.cos((lat * Math.PI) / 180));
    const deltaLat = radiusMeters / 111320; // meters per degree lat
    const deltaLon = radiusMeters / metersPerDegLon;
    const region = {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta: deltaLat * 2.2, // padding factor
      longitudeDelta: deltaLon * 2.2,
    };
    mapRef.current?.animateToRegion(region as any, 450);
  };

  useEffect(() => {
    // Auto-center on radius changes (to keep full circle visible)
    const center = selectedCoord || (mapRegion ? { latitude: mapRegion.latitude, longitude: mapRegion.longitude } : null);
    if (!center || !mapRef.current) return;
    animateToCenterWithRadius(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusMiles]);

  const handleAddressGo = async () => {
    const q = address.trim();
    if (!q) return;
    setGeoLoading(true);
    try {
      const results = await ExpoLocation.geocodeAsync(q);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        const region = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
        setMapRegion(region as any);
        setSelectedCoord({ latitude, longitude });
        animateToCenterWithRadius({ latitude, longitude });
      }
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCoord || saving) return;
    setSaving(true);
    try {
      await addSpotCloud({
        latitude: selectedCoord.latitude,
        longitude: selectedCoord.longitude,
        radiusMiles,
      });
      if (onDone) {
        onDone({ radiusMiles });
      } else {
        navigation.goBack();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TouchableOpacity
        onPress={() => { if (onBack) onBack(); else navigation.goBack(); }}
        style={{ position: 'absolute', left: 16, top: (embedded ? 24 : insets.top + 24), zIndex: 10, padding: 6 }}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>←</Text>
      </TouchableOpacity>
      <View style={{ height: (embedded ? 56 : insets.top + 56) }} />
      <Glass style={styles.card}>
        <Text style={styles.title}>Add a Spot</Text>
        <Text style={styles.sub}>Search an address or tap the map. Hold and drag pin to fine-tune location.</Text>

        <View style={{ marginTop: 8 }}>
          <View style={styles.addressRow}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Enter an address"
              placeholderTextColor="#71717a"
              returnKeyType="search"
              onSubmitEditing={handleAddressGo}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={handleAddressGo} style={styles.addressGo} disabled={geoLoading}>
              {geoLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.addressGoText}>Go</Text>
              )}
            </TouchableOpacity>
          </View>
          {!!placesError && (
            <Text style={styles.suggestError}>{placesError}</Text>
          )}
        </View>

        <View style={styles.mapWrap}>
          {mapRegion ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={mapRegion}
              onPress={handleMapPress}
              showsUserLocation
              ref={(r) => { mapRef.current = r; }}
            >
              {selectedCoord && (
                <Marker
                  coordinate={selectedCoord}
                  draggable
                  onDrag={(e) => setSelectedCoord(e.nativeEvent.coordinate)}
                  onDragEnd={(e) => {
                    const c = e.nativeEvent.coordinate;
                    setSelectedCoord(c);
                    animateToCenterWithRadius(c);
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0A84FF', borderWidth: 2, borderColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }} />
                    <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#0A84FF', marginTop: -1 }} />
                  </View>
                </Marker>
              )}
              {(selectedCoord || mapRegion) && (
                <Circle
                  center={selectedCoord || { latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
                  radius={radiusMiles * 1609.34}
                  strokeColor="rgba(52,199,89,0.9)"
                  fillColor="rgba(52,199,89,0.15)"
                />
              )}
            </MapView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.textPrimary} />
            </View>
          )}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.text}>Notification radius: {radiusMiles.toFixed(1)} mi</Text>
          <View
            style={styles.sliderContainer}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
          >
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: thumbLeft }]} />
              <View style={[styles.sliderThumb, { left: Math.max(-10, Math.min((sliderWidth || 0) - 10, thumbLeft - 10)) }]} />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <View style={[styles.btn, { opacity: 0 }]} />
          <TouchableOpacity style={[styles.btn, styles.btnPrimary, (!selectedCoord || saving) && { opacity: 0.6 }]} disabled={!selectedCoord || saving} onPress={handleSave}>
            <Text style={styles.btnPrimaryText}>{saving ? 'Saving…' : 'Save Spot'}</Text>
          </TouchableOpacity>
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, padding: 16, borderRadius: 16 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  sub: { color: colors.textSecondary, marginTop: 4 },
  text: { color: colors.textSecondary },
  mapWrap: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  btnGhost: { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  btnGhostText: { color: colors.textPrimary, fontWeight: '700' },
  btnPrimary: { borderColor: '#0A84FF', backgroundColor: '#0A84FF' },
  btnPrimaryText: { color: '#ffffff', fontWeight: '800' },
  sliderContainer: { marginTop: 10, height: 28, justifyContent: 'center' },
  sliderTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' },
  sliderFill: { height: 4, backgroundColor: colors.accent },
  sliderThumb: { position: 'absolute', top: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border },
  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  input: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, paddingHorizontal: 12 },
  addressGo: { height: 46, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  addressGoText: { color: colors.textPrimary, fontWeight: '800' },
  suggestError: { color: colors.textMuted, marginTop: 6 },
});


