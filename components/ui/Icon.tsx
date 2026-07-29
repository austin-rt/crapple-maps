import { AppleLogo } from 'phosphor-react-native/src/icons/AppleLogo';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { BabyCarriage } from 'phosphor-react-native/src/icons/BabyCarriage';
import { BookmarkSimple } from 'phosphor-react-native/src/icons/BookmarkSimple';
import { Camera } from 'phosphor-react-native/src/icons/Camera';
import { CaretLeft } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { ChatCircle } from 'phosphor-react-native/src/icons/ChatCircle';
import { Check } from 'phosphor-react-native/src/icons/Check';
import { Clock } from 'phosphor-react-native/src/icons/Clock';
import { CreditCard } from 'phosphor-react-native/src/icons/CreditCard';
import { Crosshair } from 'phosphor-react-native/src/icons/Crosshair';
import { DeviceMobile } from 'phosphor-react-native/src/icons/DeviceMobile';
import { DotsNine } from 'phosphor-react-native/src/icons/DotsNine';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';
import { Export } from 'phosphor-react-native/src/icons/Export';
import { Flame } from 'phosphor-react-native/src/icons/Flame';
import { GenderIntersex } from 'phosphor-react-native/src/icons/GenderIntersex';
import { Globe } from 'phosphor-react-native/src/icons/Globe';
import { Heart } from 'phosphor-react-native/src/icons/Heart';
import { Images } from 'phosphor-react-native/src/icons/Images';
import { Info } from 'phosphor-react-native/src/icons/Info';
import { List } from 'phosphor-react-native/src/icons/List';
import { ListBullets } from 'phosphor-react-native/src/icons/ListBullets';
import { Lock } from 'phosphor-react-native/src/icons/Lock';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { MapTrifold } from 'phosphor-react-native/src/icons/MapTrifold';
import { Moon } from 'phosphor-react-native/src/icons/Moon';
import { NavigationArrow } from 'phosphor-react-native/src/icons/NavigationArrow';
import { Newspaper } from 'phosphor-react-native/src/icons/Newspaper';
import { PencilSimple } from 'phosphor-react-native/src/icons/PencilSimple';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { PlusCircle } from 'phosphor-react-native/src/icons/PlusCircle';
import { Shuffle } from 'phosphor-react-native/src/icons/Shuffle';
import { SignOut } from 'phosphor-react-native/src/icons/SignOut';
import { Signpost } from 'phosphor-react-native/src/icons/Signpost';
import { SlidersHorizontal } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { SquaresFour } from 'phosphor-react-native/src/icons/SquaresFour';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { Sun } from 'phosphor-react-native/src/icons/Sun';
import { Tag } from 'phosphor-react-native/src/icons/Tag';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { User } from 'phosphor-react-native/src/icons/User';
import { UserCircle } from 'phosphor-react-native/src/icons/UserCircle';
import { UserPlus } from 'phosphor-react-native/src/icons/UserPlus';
import { Users } from 'phosphor-react-native/src/icons/Users';
import { Wheelchair } from 'phosphor-react-native/src/icons/Wheelchair';
import { X } from 'phosphor-react-native/src/icons/X';
import { XCircle } from 'phosphor-react-native/src/icons/XCircle';
import { View, type StyleProp, type ViewStyle } from 'react-native';

// The app's icon set: Phosphor, one component per semantic name.
// Keys keep the old Ionicons names so call sites read the same; "-outline"
// names render light, their solid twins render filled. Individual imports keep
// the other ~1,250 phosphor icons out of the bundle.
type Weight = 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
type Def = { C: React.ComponentType<{ size?: number; color?: string; weight?: Weight }>; weight?: Weight };

const ICONS = {
  search: { C: MagnifyingGlass },
  navigate: { C: NavigationArrow },
  'navigate-circle-outline': { C: NavigationArrow },
  locate: { C: Crosshair },
  location: { C: MapPin, weight: 'fill' },
  'location-outline': { C: MapPin },
  'options': { C: SlidersHorizontal },
  'options-outline': { C: SlidersHorizontal },
  add: { C: Plus },
  'add-circle': { C: PlusCircle, weight: 'fill' },
  'add-circle-outline': { C: PlusCircle },
  close: { C: X },
  'close-circle': { C: XCircle, weight: 'fill' },
  'chevron-back': { C: CaretLeft },
  'chevron-forward': { C: CaretRight },
  'arrow-back': { C: ArrowLeft },
  checkmark: { C: Check },
  menu: { C: List },
  'map': { C: MapTrifold, weight: 'fill' },
  'map-outline': { C: MapTrifold },
  'newspaper-outline': { C: Newspaper },
  'trail-sign-outline': { C: Signpost },
  'person-outline': { C: User },
  'person-add-outline': { C: UserPlus },
  'person-circle-outline': { C: UserCircle },
  bookmark: { C: BookmarkSimple, weight: 'fill' },
  'bookmark-outline': { C: BookmarkSimple },
  'share-outline': { C: Export },
  'create-outline': { C: PencilSimple },
  'chatbubble-outline': { C: ChatCircle },
  'heart-outline': { C: Heart },
  heart: { C: Heart, weight: 'fill' },
  'camera-outline': { C: Camera },
  'images-outline': { C: Images },
  'trash-outline': { C: Trash },
  'log-out-outline': { C: SignOut },
  'lock-closed': { C: Lock, weight: 'fill' },
  shuffle: { C: Shuffle },
  'logo-apple': { C: AppleLogo, weight: 'fill' },
  star: { C: Star, weight: 'fill' },
  'star-outline': { C: Star },
  flame: { C: Flame },
  earth: { C: Globe },
  pricetag: { C: Tag },
  keypad: { C: DotsNine },
  'keypad-outline': { C: DotsNine },
  card: { C: CreditCard },
  'card-outline': { C: CreditCard },
  accessibility: { C: Wheelchair },
  'male-female': { C: GenderIntersex },
  body: { C: BabyCarriage },
  'lock-closed-outline': { C: Lock },
  'people-outline': { C: Users },
  list: { C: ListBullets },
  grid: { C: SquaresFour },
  'phone-portrait-outline': { C: DeviceMobile },
  'sunny-outline': { C: Sun },
  'moon-outline': { C: Moon },
  'time-outline': { C: Clock },
  'information-circle-outline': { C: Info },
  'ellipsis-horizontal': { C: DotsThree },
} satisfies Record<string, Def>;

export type IconName = keyof typeof ICONS;

// Phosphor glyphs carry more internal padding than Ionicons did, so an equal
// `size` renders visually smaller. The bump keeps call sites' Ionicons-era
// sizes looking the same.
const SCALE = 1.18;

export function Icon({ name, size = 24, color, weight, style }: { name: IconName; size?: number; color?: string; weight?: Weight; style?: StyleProp<ViewStyle> }) {
  const def: Def = ICONS[name];
  const s = Math.round(size * SCALE);
  if (!style) return <def.C size={s} color={color} weight={weight ?? def.weight ?? 'bold'} />;
  return (
    <View style={style}>
      <def.C size={s} color={color} weight={weight ?? def.weight ?? 'bold'} />
    </View>
  );
}
