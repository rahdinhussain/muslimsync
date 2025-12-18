import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

export default function MosqueFinderScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const PAGE_SIZE = 20;
  const [searchQuery, setSearchQuery] = useState('');
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCountryOptions, setShowCountryOptions] = useState(false);
  const [showStateOptions, setShowStateOptions] = useState(false);
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const fetchMosques = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from('mosques')
          .select('id, name, country, state, city, street, zip, latitude, longitude, phone, website')
          .order('city', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('Error loading mosques from Supabase:', error.message || error);
          setLoadError(error.message || 'Failed to load mosques. Please try again later.');
          setMosques([]);
        } else {
          const mapped = (data || []).map((row) => ({
            id: row.id,
            name: row.name,
            country: row.country,
            state: row.state,
            city: row.city,
            address: row.street, // keep using address field in UI
            zip: row.zip,
            latitude: row.latitude,
            longitude: row.longitude,
            phone: row.phone,
            website: row.website,
            prayerTimes: null, // daily times now come from separate table
          }));
          setMosques(mapped);
        }
      } catch (err) {
        console.error('Unexpected error loading mosques:', err);
        setLoadError('Failed to load mosques. Please check your connection.');
        setMosques([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMosques();
  }, []);

  // Reset visible count when filters or search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, filterCountry, filterState, filterCity]);

  const activeFilterCount =
    (filterCountry ? 1 : 0) +
    (filterState ? 1 : 0) +
    (filterCity ? 1 : 0);

  const filteredMosques = useMemo(() => {
    return mosques.filter((mosque) => {
      const matchesSearch =
        mosque.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mosque.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mosque.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry =
        !filterCountry ||
        (mosque.country || '').toLowerCase() === filterCountry.toLowerCase();
      const matchesState =
        !filterState ||
        (mosque.state || '').toLowerCase() === filterState.toLowerCase();
      const matchesCityFilter =
        !filterCity ||
        (mosque.city || '').toLowerCase() === filterCity.toLowerCase();

      return matchesSearch && matchesCountry && matchesState && matchesCityFilter;
    });
  }, [mosques, searchQuery, filterCountry, filterState, filterCity]);

  const limitedMosques = useMemo(
    () => filteredMosques.slice(0, visibleCount),
    [filteredMosques, visibleCount]
  );

  const hasMore = filteredMosques.length > visibleCount;

  const groupedByCity = useMemo(() => {
    return limitedMosques.reduce((groups, mosque) => {
      if (!groups[mosque.city]) {
        groups[mosque.city] = [];
      }
      groups[mosque.city].push(mosque);
      return groups;
    }, {});
  }, [limitedMosques]);

  // Distinct lists for dropdowns
  const availableCountries = useMemo(() => {
    const set = new Set(
      mosques
        .map((m) => m.country)
        .filter((c) => c && c.trim().length > 0)
    );
    return Array.from(set).sort();
  }, [mosques]);

  const availableStates = useMemo(() => {
    if (!filterCountry) return [];
    const set = new Set(
      mosques
        .filter(
          (m) =>
            m.country &&
            m.country.toLowerCase() === filterCountry.toLowerCase()
        )
        .map((m) => m.state)
        .filter((s) => s && s.trim().length > 0)
    );
    return Array.from(set).sort();
  }, [mosques, filterCountry]);

  const availableCities = useMemo(() => {
    if (!filterCountry || !filterState) return [];
    const set = new Set(
      mosques
        .filter(
          (m) =>
            m.country &&
            m.state &&
            m.country.toLowerCase() === filterCountry.toLowerCase() &&
            m.state.toLowerCase() === filterState.toLowerCase()
        )
        .map((m) => m.city)
        .filter((c) => c && c.trim().length > 0)
    );
    return Array.from(set).sort();
  }, [mosques, filterCountry, filterState]);

  const dynamicStyles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      backgroundColor: colors.header,
      padding: 25,
      paddingTop: 10,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 20,
      marginTop: 15,
      marginBottom: 10,
      paddingHorizontal: 15,
      borderRadius: 15,
      height: 50,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    filterIconButton: {
      marginLeft: 8,
      padding: 4,
      position: 'relative',
    },
    mosqueCard: {
      backgroundColor: colors.card,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      ...(isDark ? {} : {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    mosqueIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.iconBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    mosqueName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    mosqueAddress: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 5,
      flex: 1,
    },
    mosquePhone: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 5,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 10,
    },
    cityHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 6,
    },
    filterModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterModalContent: {
      width: '90%',
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
    },
    filterTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    filterFieldLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 4,
    },
    filterInput: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cardSecondary,
      color: colors.text,
    },
    dropdownField: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cardSecondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownValueText: {
      fontSize: 14,
      color: colors.text,
    },
    dropdownPlaceholderText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    optionsList: {
      position: 'absolute',
      top: 44,
      left: 0,
      right: 0,
      maxHeight: 160,
      borderRadius: 10,
      backgroundColor: colors.cardSecondary,
      paddingVertical: 4,
      zIndex: 10,
    },
    optionItem: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    optionText: {
      fontSize: 14,
      color: colors.text,
    },
    filterButtonsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
    },
    filterButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      marginLeft: 8,
      backgroundColor: colors.cardSecondary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    filterBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.surface,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
        <View style={dynamicStyles.container}>
          <View style={[dynamicStyles.header, { marginBottom: 0 }]}>
            <Text style={dynamicStyles.headerTitle}>Find Mosques</Text>
            <Text style={dynamicStyles.headerSubtitle}>
              Loading mosques from Supabase...
            </Text>
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={dynamicStyles.emptyText}>Please wait</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.safeArea} edges={['top']}>
      <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Find Mosques</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Browse and filter mosques
        </Text>
      </View>

      {loadError && (
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
            {loadError}
          </Text>
        </View>
      )}

      <View style={dynamicStyles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={dynamicStyles.searchInput}
          placeholder="Search mosques..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textTertiary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={dynamicStyles.filterIconButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={22} color={colors.textSecondary} />
          {activeFilterCount > 0 && (
            <View style={dynamicStyles.filterBadge}>
              <Text style={dynamicStyles.filterBadgeText}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
      <Modal
        transparent
        visible={showFilterModal}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={dynamicStyles.filterModalOverlay}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={dynamicStyles.filterModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={dynamicStyles.filterTitle}>Filters</Text>

            <Text style={dynamicStyles.filterFieldLabel}>Country</Text>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={dynamicStyles.dropdownField}
                onPress={() => {
                  setShowCountryOptions((v) => !v);
                  setShowStateOptions(false);
                  setShowCityOptions(false);
                }}
              >
                <Text
                  style={
                    filterCountry
                      ? dynamicStyles.dropdownValueText
                      : dynamicStyles.dropdownPlaceholderText
                  }
                >
                  {filterCountry || 'Select country'}
                </Text>
                <Ionicons
                  name={showCountryOptions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showCountryOptions && (
                <ScrollView style={dynamicStyles.optionsList}>
                  {availableCountries.map((country) => (
                    <TouchableOpacity
                      key={country}
                      style={dynamicStyles.optionItem}
                      onPress={() => {
                        setFilterCountry(country);
                        setFilterState('');
                        setFilterCity('');
                        setShowCountryOptions(false);
                      }}
                    >
                      <Text style={dynamicStyles.optionText}>{country}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <Text style={dynamicStyles.filterFieldLabel}>State / Province</Text>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={dynamicStyles.dropdownField}
                onPress={() => {
                  if (!filterCountry) return;
                  setShowStateOptions((v) => !v);
                  setShowCountryOptions(false);
                  setShowCityOptions(false);
                }}
                disabled={!filterCountry}
              >
                <Text
                  style={
                    filterState
                      ? dynamicStyles.dropdownValueText
                      : dynamicStyles.dropdownPlaceholderText
                  }
                >
                  {filterCountry
                    ? filterState || 'Select state / province'
                    : 'Select country first'}
                </Text>
                <Ionicons
                  name={showStateOptions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showStateOptions && (
                <ScrollView style={dynamicStyles.optionsList}>
                  {availableStates.map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={dynamicStyles.optionItem}
                      onPress={() => {
                        setFilterState(state);
                        setFilterCity('');
                        setShowStateOptions(false);
                      }}
                    >
                      <Text style={dynamicStyles.optionText}>{state}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <Text style={dynamicStyles.filterFieldLabel}>City</Text>
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={dynamicStyles.dropdownField}
                onPress={() => {
                  if (!filterCountry || !filterState) return;
                  setShowCityOptions((v) => !v);
                  setShowCountryOptions(false);
                  setShowStateOptions(false);
                }}
                disabled={!filterCountry || !filterState}
              >
                <Text
                  style={
                    filterCity
                      ? dynamicStyles.dropdownValueText
                      : dynamicStyles.dropdownPlaceholderText
                  }
                >
                  {filterCountry && filterState
                    ? filterCity || 'Select city'
                    : 'Select country & state first'}
                </Text>
                <Ionicons
                  name={showCityOptions ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showCityOptions && (
                <ScrollView style={dynamicStyles.optionsList}>
                  {availableCities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={dynamicStyles.optionItem}
                      onPress={() => {
                        setFilterCity(city);
                        setShowCityOptions(false);
                      }}
                    >
                      <Text style={dynamicStyles.optionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={dynamicStyles.filterButtonsRow}>
              <TouchableOpacity
                style={dynamicStyles.filterButton}
                onPress={() => {
                  setFilterCountry('');
                  setFilterState('');
                  setFilterCity('');
                  setShowCountryOptions(false);
                  setShowStateOptions(false);
                  setShowCityOptions(false);
                }}
              >
                <Text style={dynamicStyles.filterButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dynamicStyles.filterButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={dynamicStyles.filterButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.mosquesList}
        ref={scrollViewRef}
      >
        {filteredMosques.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={colors.textTertiary} />
            <Text style={dynamicStyles.emptyText}>No mosques found</Text>
          </View>
        ) : (
          <>
            {Object.entries(groupedByCity).map(([city, cityMosques]) => (
              <View key={city}>
                <Text style={dynamicStyles.cityHeader}>{city}</Text>
                {cityMosques.map((mosque) => (
                  <TouchableOpacity
                    key={mosque.id}
                    style={dynamicStyles.mosqueCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('MosqueSchedule', { mosque })
                    }
                  >
                    <View style={styles.mosqueCardContent}>
                      <View style={dynamicStyles.mosqueIcon}>
                        <Ionicons name="location" size={28} color={colors.text} />
                      </View>
                      <View style={styles.mosqueInfo}>
                        <Text style={dynamicStyles.mosqueName}>{mosque.name}</Text>
                        <View style={styles.mosqueDetails}>
                          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                          <Text style={dynamicStyles.mosqueAddress}>{mosque.address}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {hasMore && (
              <View style={{ paddingHorizontal: 0, paddingVertical: 10 }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.cardSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    setVisibleCount((prev) => prev + PAGE_SIZE);
                    // After loading more, scroll to the end so the button stays at the bottom
                    setTimeout(() => {
                      if (scrollViewRef.current) {
                        scrollViewRef.current.scrollToEnd({ animated: true });
                      }
                    }, 0);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '600' }}>
                    Load more mosques
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchIcon: {
    marginRight: 10,
  },
  mosquesList: {
    flex: 1,
    padding: 20,
  },
  mosqueCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  mosqueInfo: {
    flex: 1,
  },
  mosqueDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});

