import { View } from 'react-native';

import { ActionButton } from '@/components/ui';
import { DANGER } from '@/lib/tokens';

export function ActionRow({
  onDirections,
  saved,
  onToggleSave,
  onShare,
  editing,
  onEditToggle,
}: {
  onDirections: () => void;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  editing: boolean;
  onEditToggle: () => void;
}) {
  return (
    <View className="mt-4 flex-row gap-6">
      <ActionButton icon="navigate" label="Directions" filled onPress={onDirections} />
      <ActionButton icon={saved ? 'bookmark' : 'bookmark-outline'} label={saved ? 'Saved' : 'Save'} filled={saved} onPress={onToggleSave} />
      <ActionButton icon="share-outline" label="Share" onPress={onShare} />
      <ActionButton
        icon={editing ? 'close-circle' : 'create-outline'}
        label={editing ? 'Cancel' : 'Edit'}
        filled={editing}
        tint={editing ? DANGER : undefined}
        onPress={onEditToggle}
      />
    </View>
  );
}
