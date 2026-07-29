import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ACCENT } from '@/lib/tokens';
import { useColors } from '@/lib/theme';

// Tag-style input for access codes: comma/space/enter/tab/blur commit a pill;
// backspace on an empty field pops the last pill back into the text for editing.
// `InputComponent` lets callers pass BottomSheetTextInput inside a bottom sheet,
// or the default RN TextInput on a plain screen.
export function CodePills({
  value,
  onChange,
  placeholder,
  InputComponent = TextInput,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  InputComponent?: React.ComponentType<React.ComponentProps<typeof TextInput>>;
}) {
  const [text, setText] = useState('');

  const commit = (raw: string) => {
    const parts = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
  };

  const onType = (t: string) => {
    // A separator in the stream finalizes everything before the trailing fragment.
    if (/[,\s]/.test(t)) {
      const parts = t.split(/[,\s]+/);
      const trailing = parts.pop() ?? '';
      commit(parts.join(' '));
      setText(trailing);
    } else {
      setText(t);
    }
  };

  const onKey = (e: { nativeEvent: { key: string } }) => {
    const key = e.nativeEvent.key;
    if (key === 'Backspace' && text === '' && value.length) {
      const last = value[value.length - 1];
      onChange(value.slice(0, -1));
      setText(last);
    } else if (key === 'Tab') {
      commit(text);
      setText('');
    }
  };

  const flush = () => {
    commit(text);
    setText('');
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const c = useColors();
  return (
    <View className="flex-row flex-wrap items-center gap-2 rounded-xl border border-neutral-300 p-2 dark:border-neutral-700">
      {value.map((code, i) => (
        <View key={`${code}-${i}`} className="flex-row items-center gap-1 rounded-lg py-1.5 pl-2.5 pr-1.5" style={{ backgroundColor: ACCENT + '22' }}>
          <Text className="text-sm font-bold tracking-widest" style={{ color: ACCENT }}>{code}</Text>
          <Pressable onPress={() => remove(i)} hitSlop={6} className="active:opacity-60">
            <Ionicons name="close" size={14} color={ACCENT} />
          </Pressable>
        </View>
      ))}
      <InputComponent
        value={text}
        onChangeText={onType}
        onKeyPress={onKey}
        onSubmitEditing={flush}
        onBlur={flush}
        blurOnSubmit={false}
        returnKeyType="done"
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={value.length ? '' : placeholder}
        placeholderTextColor={c.content2}
        className="min-w-[96px] flex-1 px-1 py-1.5 text-base text-neutral-900 dark:text-neutral-50"
      />
    </View>
  );
}
