import { Pressable, Text, TextInput, View } from 'react-native';

import { CodePills, INPUT_CLS, SectionHeader, Segmented } from '@/components/ui';
import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';
import type { AccessType, RestroomDraft } from '@/lib/types';

const TRISTATE: [string, boolean | null][] = [
  ['Unknown', null],
  ['Yes', true],
  ['No', false],
];

const ACCESS_OPTS: [string, AccessType][] = [
  ['Public', 'public'],
  ['Customers', 'customers_only'],
  ['Code', 'code'],
  ['Ask staff', 'ask_staff'],
];

const AMENITIES: [string, 'accessible' | 'unisex' | 'changing_table'][] = [
  ['Accessible', 'accessible'],
  ['Gender-neutral', 'unisex'],
  ['Changing table', 'changing_table'],
];

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${on ? 'border-transparent' : 'border-line'}`}
      style={on ? { backgroundColor: ACCENT } : undefined}>
      <Text className={on ? 'text-sm font-semibold text-white' : 'text-sm text-content-2'}>{label}</Text>
    </Pressable>
  );
}

// Shared create/edit form. `variant='edit'` shows the listing-detail fields the
// restroom sheet edits; `variant='create'` adds name, access type and amenities.
// `InputComponent` is BottomSheetTextInput inside a sheet, TextInput on a screen.
export function EditForm({
  draft,
  onChange,
  variant = 'edit',
  InputComponent = TextInput,
}: {
  draft: RestroomDraft;
  onChange: (patch: Partial<RestroomDraft>) => void;
  variant?: 'edit' | 'create';
  InputComponent?: React.ComponentType<React.ComponentProps<typeof TextInput>>;
}) {
  const isCreate = variant === 'create';
  const c = useColors();
  return (
    <View>
      {isCreate ? (
        <>
          <SectionHeader>Name optional</SectionHeader>
          <InputComponent
            value={draft.name}
            onChangeText={(t) => onChange({ name: t })}
            placeholder="e.g. Blue Bottle Coffee"
            placeholderTextColor={c.content2}
            className={INPUT_CLS}
          />
        </>
      ) : null}

      <SectionHeader>How to find it</SectionHeader>
      <InputComponent
        value={draft.directions}
        onChangeText={(t) => onChange({ directions: t })}
        placeholder="e.g. Around back, separate entrance to the left of the bar…"
        placeholderTextColor={c.content2}
        multiline
        className={`${INPUT_CLS} min-h-16`}
      />

      {isCreate ? (
        <>
          <SectionHeader>Access</SectionHeader>
          <Segmented options={ACCESS_OPTS} value={draft.access_type} onChange={(v) => onChange({ access_type: v })} />

          <SectionHeader>Features</SectionHeader>
          <View className="flex-row flex-wrap gap-2">
            {AMENITIES.map(([label, key]) => (
              <Toggle key={key} label={label} on={!!draft[key]} onPress={() => onChange({ [key]: !draft[key] } as Partial<RestroomDraft>)} />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader>Requires a code?</SectionHeader>
      <Segmented options={TRISTATE} value={draft.requires_code} onChange={(v) => onChange({ requires_code: v })} />

      <SectionHeader>Purchase required?</SectionHeader>
      <Segmented options={TRISTATE} value={draft.purchase_required} onChange={(v) => onChange({ purchase_required: v })} />

      {draft.requires_code !== false ? (
        <>
          <SectionHeader>Access codes</SectionHeader>
          <CodePills
            value={draft.codes}
            onChange={(codes) => onChange({ codes })}
            placeholder="Type a code, then space or comma to add"
            InputComponent={InputComponent}
          />
        </>
      ) : null}
    </View>
  );
}
