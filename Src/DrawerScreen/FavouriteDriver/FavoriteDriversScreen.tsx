import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import { COLORS } from "../../utils/colors";
import { FONTS } from "../../utils/fonts";
import { ScreenHeader } from "../../components/ui";

export default function FavoriteDriversScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");

  const favoriteDrivers = [
    {
      id: 1,
      name: "Rahul Sharma",
      rating: 4.9,
      rides: 42,
      vehicle: "Swift Dzire • MP09AB1234",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 2,
      name: "Amit Verma",
      rating: 4.8,
      rides: 28,
      vehicle: "Hyundai Aura • MP09XY6789",
      image: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
      id: 3,
      name: "Sanjay Patel",
      rating: 4.7,
      rides: 19,
      vehicle: "Maruti Baleno • MP09PQ1122",
      image: "https://randomuser.me/api/portraits/men/15.jpg",
    },
  ];

  const filteredDrivers = favoriteDrivers.filter((driver) =>
    driver.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      {/* Header */}
      <View style={{ paddingHorizontal: 20 }}>
        <ScreenHeader title="Favorite Drivers" />
      </View>
      {/* Search */}

      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.text} />

          <TextInput
            placeholder="Search driver"
            placeholderTextColor={COLORS.placeholder}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
      >
        {filteredDrivers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={80} color="#D8D8D8" />

            <Text style={styles.emptyTitle}>No Favourite Drivers</Text>

            <Text style={styles.emptyText}>
              Your favourite drivers will appear here.
            </Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => (
            <View key={driver.id} style={styles.driverCard}>
              {/* Top */}

              <View style={styles.driverRow}>
                <Image
                  source={{
                    uri: driver.image,
                  }}
                  style={styles.avatar}
                />

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.driverName}>{driver.name}</Text>

                    <View style={styles.favoriteBadge}>
                      <Ionicons name="heart" size={12} color="#FF4D67" />

                      <Text style={styles.favoriteText}>Favourite</Text>
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F9B115" />

                    <Text style={styles.ratingText}>{driver.rating}</Text>
                  </View>
                </View>
              </View>

              {/* Info */}

              <View style={styles.infoContainer}>
                <InfoItem icon="car-outline" value={driver.vehicle} />

                <InfoItem
                  icon="repeat-outline"
                  value={`${driver.rides} rides together`}
                />
              </View>

              {/* Buttons */}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.callButton}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={COLORS.black}
                  />

                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>

                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.bookButton}
                >
                  <TouchableOpacity
                    style={{
                      alignItems: "center",
                    }}
                  >
                    <Text style={styles.bookText}>Book Ride</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoItem = ({ icon, value }: { icon: any; value: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color={COLORS.primary} />

    <Text style={styles.infoText}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
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
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.black,
    fontFamily: FONTS.medium,
  },

  driverCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
    marginRight: 14,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  driverName: {
    fontSize: 18,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  favoriteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  favoriteText: {
    marginLeft: 4,
    color: "#FF4D67",
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  ratingText: {
    marginLeft: 4,
    fontFamily: FONTS.medium,
    color: COLORS.black,
  },

  infoContainer: {
    marginTop: 18,
    gap: 10,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoText: {
    marginLeft: 10,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    flex: 1,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },

  callButton: {
    flex: 1,
    height: 52,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  callText: {
    marginLeft: 8,
    color: COLORS.black,
    fontFamily: FONTS.semiBold,
  },

  bookButton: {
    flex: 1,
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  bookText: {
    color: "#FFF",
    fontFamily: FONTS.bold,
    fontSize: 15,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    color: COLORS.black,
    fontFamily: FONTS.bold,
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.text,
    textAlign: "center",
    fontFamily: FONTS.medium,
  },
});
