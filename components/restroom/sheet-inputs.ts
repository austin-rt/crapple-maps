import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Platform, ScrollView, TextInput } from 'react-native';

// The restroom detail renders inside a @gorhom bottom sheet on native but inside
// a plain left drawer on web. The BottomSheet* variants call useBottomSheetInternal
// and throw when there's no sheet context, so fall back to plain RN primitives on
// web. Picked at module load — same props surface either way.
export const SheetScrollView: any = Platform.OS === 'web' ? ScrollView : BottomSheetScrollView;
export const SheetTextInput: any = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;
