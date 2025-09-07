// Installation required:
// npm install react-native-maps
// cd ios && pod install

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  MapPressEvent,
  Region,
} from 'react-native-maps';
import { getCurrentLocation } from '../services/locationService';

const AppleMapsExample = () => {
  const mapRef = useRef<MapView | null>(null);

  // Region initialized from user's current location (no hardcoded defaults)
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Markers collection (start empty)
  const [markers, setMarkers] = useState<Array<{
    id: number;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description?: string;
  }>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const loc = await getCurrentLocation();
      if (loc) {
        const { latitude, longitude } = loc.coords;
        const initial: Region = {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        };
        setRegion(initial);
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(initial, 700);
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleMapPress = (event: MapPressEvent) => {
    const { coordinate } = event.nativeEvent;
    const newMarker = {
      id: Date.now(),
      coordinate,
      title: 'Selected Location',
      description: `Lat: ${coordinate.latitude.toFixed(4)}, Lng: ${coordinate.longitude.toFixed(4)}`,
    };
    setMarkers([newMarker]);
  };

  const centerOnLocation = async () => {
    const loc = await getCurrentLocation();
    if (!loc) return;
    const { latitude, longitude } = loc.coords;
    const newRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 700);
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return (
    <View style={styles.container}>
      {loading || !region ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: '#666' }}>Fetching your location…</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          mapType="standard"
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              identifier={marker.id.toString()}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              onCalloutPress={() => 
                Alert.alert('Marker', `${marker.title}: ${marker.description ?? ''}`)
              }
            />
          ))}
        </MapView>
      )}

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={centerOnLocation}>
          <Text style={styles.buttonText}>Center</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearMarkers}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Info panel */}
      {region && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>Markers: {markers.length}</Text>
          <Text style={styles.infoText}>
            Lat: {region.latitude.toFixed(4)}, Lng: {region.longitude.toFixed(4)}
          </Text>
          <Text style={styles.helpText}>Tap on map to set a marker</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default AppleMapsExample;

// ADDITIONAL CONFIGURATION FOR iOS (ios/YourProject/Info.plist):
/*
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location to show your position on the map.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location to show your position on the map.</string>
*/

// ADDITIONAL CONFIGURATION FOR ANDROID (android/app/src/main/AndroidManifest.xml):
/*
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Inside <application> tag -->
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
*/