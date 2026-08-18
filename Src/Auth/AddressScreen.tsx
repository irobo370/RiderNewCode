import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

import { COLORS } from "../utils/colors";
import { FONTS } from "../utils/fonts";
import { ScreenHeader } from "../components/ui";
import { getCurrentLocation } from "../utils/locationHelpers";
import { SAMPLE_ADDRESSES } from "../constants/locale";

export default function AddressScreen() {
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);

  const [selectedAddress, setSelectedAddress] = useState("");

  const [addressTitle, setAddressTitle] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");

  const savedAddresses = SAMPLE_ADDRESSES.filter(
    (item) => item.type === "home" || item.type === "work",
  ).map((item) => ({
    id: item.id,
    title: item.label,
    address: item.address,
  }));

  const favouriteAddresses = SAMPLE_ADDRESSES.filter(
    (item) => item.type === "other",
  ).map((item) => ({
    id: item.id,
    title: item.label,
    address: item.address,
  }));

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result.length > 0) {
        const place = result[0];

        const fullAddress = [
          place.name,
          place.street,
          place.city,
          place.region,
          place.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        setSelectedAddress(fullAddress);

        setCity(place.city || "");
        setStateName(place.region || "");
        setZipCode(place.postalCode || "");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const location = await getCurrentLocation();
      if (cancelled || !location) return;

      setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setSelectedAddress(location.address);
      await getAddressFromCoordinates(location.latitude, location.longitude);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      <ScreenHeader title="Addresses" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Saved */}

        <Text style={styles.sectionTitle}>Saved Addresses</Text>

        {savedAddresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <Ionicons name="home-outline" size={22} color={COLORS.primary} />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.addressTitle}>{item.title}</Text>
              <Text style={styles.addressText}>{item.address}</Text>
            </View>
          </View>
        ))}

        {/* Favourites */}

        <Text style={styles.sectionTitle}>Favourite Places</Text>

        {favouriteAddresses.map((item) => (
          <View key={item.id} style={styles.addressCard}>
            <Ionicons name="heart" size={22} color="#FF4D67" />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.addressTitle}>{item.title}</Text>
              <Text style={styles.addressText}>{item.address}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addAddressBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={22} color={COLORS.primary} />
          <Text style={styles.addAddressText}>Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          {/* Floating Close */}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>

          {/* Map */}

          {selectedLocation ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              onPress={async (e) => {
                const coordinate = e.nativeEvent.coordinate;

                setSelectedLocation(coordinate);

                await getAddressFromCoordinates(
                  coordinate.latitude,
                  coordinate.longitude,
                );
              }}
            >
              <Marker coordinate={selectedLocation} />
            </MapView>
          ) : (
            <View style={[styles.map, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={styles.selectedAddressText}>Getting current location…</Text>
            </View>
          )}

          {/* Selected Address */}

          <View style={styles.addressPreview}>
            <Ionicons name="location" size={20} color={COLORS.primary} />

            <Text style={styles.selectedAddressText}>
              {selectedAddress || "Select location on map"}
            </Text>
          </View>

          {/* Form */}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              placeholder="Address Title (Home, Work)"
              style={styles.input}
              value={addressTitle}
              onChangeText={setAddressTitle}
            />

            <TextInput
              placeholder="House / Flat Number"
              style={styles.input}
              value={houseNo}
              onChangeText={setHouseNo}
            />

            <TextInput
              placeholder="Landmark"
              style={styles.input}
              value={landmark}
              onChangeText={setLandmark}
            />

            <TextInput
              placeholder="City"
              style={styles.input}
              value={city}
              onChangeText={setCity}
            />

            <TextInput
              placeholder="State"
              style={styles.input}
              value={stateName}
              onChangeText={setStateName}
            />

            <TextInput
              placeholder="ZIP Code"
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
            />

            <TouchableOpacity activeOpacity={0.9}>
              <LinearGradient colors={COLORS.gradient} style={styles.saveBtn}>
                <Text style={styles.saveText}>Save Address</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.black,
  },

  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.black,
  },

  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },

  addressTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.black,
  },

  addressText: {
    marginTop: 4,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },

  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    marginBottom: 30,
  },

  addAddressText: {
    marginLeft: 8,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  map: {
    height: 320,
    width: "100%",
  },

  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 999,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  addressPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 3,
  },

  selectedAddressText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  formContent: {
    padding: 20,
    paddingBottom: 40,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    fontFamily: FONTS.medium,
  },

  saveBtn: {
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  saveText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
});
