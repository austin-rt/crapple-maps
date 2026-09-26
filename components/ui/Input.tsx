import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { useColors } from '@/lib/theme';

type Variant = 'boxed' | 'bare' | 'pill';

const SHAPE: Record<Variant, string> = {
  boxed: 'rounded-xl border border-line px-4 text-content',
  bare: 'text-content',
  pill: 'rounded-full border border-line px-4 text-content',
};
const HEIGHT: Record<Variant, number> = { boxed: 48, bare: 44, pill: 40 };

// The one text field used across the app. Single-line fields get a fixed
// height, no line height and centered text: Tailwind's text-base adds a 24px
// line height, which iOS draws below center inside a TextInput. `bare` sits
// inside a caller's own bordered row (search bars); `as` swaps in the
// bottom-sheet TextInput where the field lives in a sheet.
export const Input = forwardRef<TextInput, TextInputProps & { variant?: Variant; as?: React.ComponentType<any> }>(
  function Input({ variant = 'boxed', as, className = '', style, multiline, placeholderTextColor, ...rest }, ref) {
    const Component: React.ComponentType<any> = as ?? TextInput;
    const c = useColors();
    const layout = multiline
      ? { fontSize: 16, minHeight: 80, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' as const }
      : { fontSize: variant === 'pill' ? 15 : 16, height: HEIGHT[variant], paddingVertical: 0, textAlignVertical: 'center' as const, includeFontPadding: false };
    return (
      <Component
        ref={ref}
        multiline={multiline}
        placeholderTextColor={placeholderTextColor ?? c.content2}
        className={`${SHAPE[variant]} ${className}`}
        style={[layout, style]}
        {...rest}
      />
    );
  },
);
