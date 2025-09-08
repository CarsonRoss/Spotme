import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, PanResponder, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Glass from './Glass';
import { colors } from '../theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { updateSpotCloud, deleteSpotCloud } from '../services/cloudStorage';
import * as ExpoLocation from 'expo-location';
import { config } from '../config';

type Params = { spotId: string; name?: string; radiusMiles: number; latitude?: number; longitude?: number };

export default function EditSpotScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { spotId, name: initialName = '', radiusMiles: initialRadius = 0.3, latitude, longitude } = (route.params || {}) as Params;
  const [name, setName] = useState(initialName);
  const [radiusMiles, setRadiusMiles] = useState(initialRadius);
  const [address, setAddress] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ description: string; placeId: string }>>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const GOOGLE_PLACES_KEY = config.googleMaps?.apiKey || '';
  const generateSessionToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const [placesSessionToken, setPlacesSessionToken] = useState<string>(generateSessionToken());
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [coord, setCoord] = useState<{ latitude: number; longitude: number } | null>(latitude && longitude ? { latitude, longitude } : null);
  const MI_TO_METERS = 1609.34;

  useEffect(() => {
    if (latitude && longitude) {
      const metersPerDegLat = 111320;
      const metersPerDegLon = 111320 * Math.max(0.00001, Math.cos((latitude * Math.PI) / 180));
      const rMeters = initialRadius * MI_TO_METERS;
      const angular = Math.max(rMeters / metersPerDegLat, rMeters / metersPerDegLon);
      const PAD = 2.6;
      setMapRegion({ latitude, longitude, latitudeDelta: angular * PAD, longitudeDelta: angular * PAD });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (coord && mapRef.current) {
      const metersPerDegLat = 111320;
      const metersPerDegLon = 111320 * Math.max(0.00001, Math.cos((coord.latitude * Math.PI) / 180));
      const rMeters = (typeof radiusMiles === 'number' ? radiusMiles : initialRadius) * MI_TO_METERS;
      const angular = Math.max(rMeters / metersPerDegLat, rMeters / metersPerDegLon);
      const PAD = 2.6;
      mapRef.current.animateToRegion({ latitude: coord.latitude, longitude: coord.longitude, latitudeDelta: angular * PAD, longitudeDelta: angular * PAD } as any, 350);
    }
  }, [radiusMiles]);


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
    const trimmed = name.trim();
    await updateSpotCloud(spotId, {
      name: trimmed.length === 0 ? null : trimmed,
      radiusMiles,
      latitude: coord?.latitude,
      longitude: coord?.longitude,
    });
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

        <View style={{ marginTop: 8 }}>
          <View style={styles.addressRow}>
            <TextInput
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                if (suggestTimer.current) clearTimeout(suggestTimer.current);
                const text = t.trim();
                if (text.length < 3) {
                  setSuggestions([]);
                  setPlacesError(null);
                  return;
                }
                suggestTimer.current = setTimeout(async () => {
                  try {
                    setSuggestionsLoading(true);
                    setPlacesError(null);
                    if (!GOOGLE_PLACES_KEY) { setSuggestions([]); return; }
                    const center = coord || mapRegion ? { latitude: (coord?.latitude ?? mapRegion!.latitude), longitude: (coord?.longitude ?? mapRegion!.longitude) } : null;
                    const biasRadius = Math.max(5000, radiusMiles * 1609.34 * 2);
                    const params = [
                      `input=${encodeURIComponent(text)}`,
                      `key=${GOOGLE_PLACES_KEY}`,
                      `types=address`,
                      `sessiontoken=${placesSessionToken}`,
                    ];
                    if (center) params.push(`locationbias=circle:${Math.round(biasRadius)}@${center.latitude},${center.longitude}`);
                    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.join('&')}`;
                    const resp = await fetch(url);
                    const json = await resp.json();
                    if (json?.status && json.status !== 'OK') {
                      setPlacesError(`${json.status}${json.error_message ? `: ${json.error_message}` : ''}`);
                      setSuggestions([]);
                      return;
                    }
                    const preds = Array.isArray(json?.predictions) ? json.predictions : [];
                    const mapped = preds.slice(0, 6).map((p: any) => ({ description: p.description as string, placeId: p.place_id as string }));
                    setSuggestions(mapped);
                  } catch {
                    setSuggestions([]);
                    setPlacesError('Network error contacting Places API');
                  } finally {
                    setSuggestionsLoading(false);
                  }
                }, 300);
              }}
              placeholder="Enter an address"
              placeholderTextColor="#71717a"
              returnKeyType="search"
              onSubmitEditing={async () => {
                const q = address.trim();
                if (!q) return;
                setGeoLoading(true);
                try {
                  const res = await ExpoLocation.geocodeAsync(q);
                  if (res && res.length > 0) {
                    const { latitude: lat, longitude: lon } = res[0];
                    setCoord({ latitude: lat, longitude: lon });
                    setMapRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                  }
                } finally {
                  setGeoLoading(false);
                }
              }}
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={async () => {
              const q = address.trim();
              if (!q) return;
              setGeoLoading(true);
              try {
                const res = await ExpoLocation.geocodeAsync(q);
                if (res && res.length > 0) {
                  const { latitude: lat, longitude: lon } = res[0];
                  setCoord({ latitude: lat, longitude: lon });
                  setMapRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                }
              } finally {
                setGeoLoading(false);
              }
            }} style={styles.addressGo} disabled={geoLoading}>
              {geoLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.addressGoText}>Go</Text>
              )}
            </TouchableOpacity>
          </View>
          {suggestions.length > 0 && (
            <View style={styles.suggestBox}>
              {suggestions.map((s, i) => (
                <TouchableOpacity key={`${s.placeId}-${i}`} style={styles.suggestItem} onPress={async () => {
                  setAddress(s.description);
                  setSuggestions([]);
                  setGeoLoading(true);
                  try {
                    if (!GOOGLE_PLACES_KEY) return;
                    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(s.placeId)}&key=${GOOGLE_PLACES_KEY}&fields=geometry,formatted_address&sessiontoken=${placesSessionToken}`;
                    const resp = await fetch(url);
                    const json = await resp.json();
                    const loc = json?.result?.geometry?.location;
                    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                      setCoord({ latitude: loc.lat, longitude: loc.lng });
                      setMapRegion({ latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                    }
                  } finally {
                    setGeoLoading(false);
                    setPlacesSessionToken(generateSessionToken());
                  }
                }}>
                  <Text style={styles.suggestText} numberOfLines={1}>{s.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {!!placesError && (
            <Text style={styles.suggestError}>{placesError}</Text>
          )}
        </View>

        <View style={styles.mapWrap}>
          {mapRegion ? (
            <MapView
              style={{ flex: 1 }}
              initialRegion={mapRegion}
              onPress={(e) => setCoord(e.nativeEvent.coordinate)}
              ref={(r) => { mapRef.current = r; }}
            >
              {coord && (
                <Marker
                  coordinate={coord}
                  draggable
                  tracksViewChanges={false}
                  onDrag={(e) => setCoord(e.nativeEvent.coordinate)}
                  onDragEnd={(e) => {
                    const c = e.nativeEvent.coordinate;
                    setCoord(c);
                    // animate map to fit radius
                    const metersPerDegLat = 111320;
                    const metersPerDegLon = 111320 * Math.max(0.00001, Math.cos((c.latitude * Math.PI) / 180));
                    const rMeters = (typeof radiusMiles === 'number' ? radiusMiles : initialRadius) * MI_TO_METERS;
                    const angular = Math.max(rMeters / metersPerDegLat, rMeters / metersPerDegLon);
                    const PAD = 2.6;
                    mapRef.current?.animateToRegion({ latitude: c.latitude, longitude: c.longitude, latitudeDelta: angular * PAD, longitudeDelta: angular * PAD } as any, 350);
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#0A84FF', borderWidth: 2, borderColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }} />
                    <View style={{ width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#0A84FF', marginTop: -1 }} />
                  </View>
                </Marker>
              )}
              {coord && (
                <Circle
                  center={coord}
                  radius={radiusMiles * MI_TO_METERS}
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
          <Text style={styles.label}>Radius: {radiusMiles.toFixed(1)} mi</Text>
          <View style={styles.sliderContainer} onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)} {...panResponder.panHandlers}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: thumbLeft }]} />
              <View style={[styles.sliderThumb, { left: Math.max(-10, Math.min((sliderWidth || 0) - 10, thumbLeft - 10)) }]} />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <TouchableOpacity style={[styles.btnSm, styles.btnPrimary]} onPress={onSave}>
            <Text style={styles.btnPrimaryText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSm, styles.deleteBtn]} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
  btnSm: { flex: 0.48, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  btnGhost: { borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  btnGhostText: { color: colors.textPrimary, fontWeight: '700' },
  btnPrimary: { borderColor: '#0A84FF', backgroundColor: '#0A84FF' },
  btnPrimaryText: { color: '#ffffff', fontWeight: '800' },
  deleteBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  deleteText: { color: '#ff4545', fontWeight: '800' },
  mapWrap: { height: 280, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginTop: 12 },
  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  addressGo: { height: 46, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  addressGoText: { color: colors.textPrimary, fontWeight: '800' },
  suggestBox: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: '#141416' },
  suggestItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  suggestText: { color: colors.textPrimary, fontSize: 14 },
  suggestError: { color: colors.textMuted, marginTop: 6 },
});


