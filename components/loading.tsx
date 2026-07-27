import LottieView from 'lottie-react-native';
import { View } from 'react-native';

const DEFAULT = require('@/assets/lottie/flush.json');

// Lottie plumbing lives here. Pass a bundled require() or a { uri } (e.g. a
// LottieFiles "lottie.host" URL) so animations are trivial to swap/add.
export function Loading({
  size = 72,
  source = DEFAULT,
  fill = false,
}: {
  size?: number;
  source?: any;
  fill?: boolean;
}) {
  return (
    <View className={`items-center justify-center ${fill ? 'flex-1 bg-white dark:bg-neutral-950' : ''}`}>
      <LottieView source={source} autoPlay loop style={{ width: size, height: size }} />
    </View>
  );
}
