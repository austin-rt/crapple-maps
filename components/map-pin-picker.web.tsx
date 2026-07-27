import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

type Coords = { latitude: number; longitude: number };

// Web override — no react-native-maps drag map on web; use the searched location.
export function MapPinPicker(_props: { coords: Coords; onChange: (c: Coords) => void }) {
  return (
    <View className="mt-3 items-center rounded-xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
      <Ionicons name="map-outline" size={22} color="#9CA3AF" />
      <Text className="mt-1 text-center text-xs text-neutral-400">
        Pin fine-tuning is available in the app. Using the selected location.
      </Text>
    </View>
  );
}
