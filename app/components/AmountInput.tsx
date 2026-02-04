import { StyleSheet, TextInput, View } from 'react-native';
import { Token } from '../jupiter/tokens';
import { colors, fontSize, fontWeight, spacing } from '../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  token: Token;
  label?: string;
  editable?: boolean;
};

export default function AmountInput({
  value,
  onChangeText,
  token,
  editable = true,
}: Props) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > token.decimals) return;
    onChangeText(cleaned);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.text.tertiary}
        editable={editable}
        selectionColor={colors.accent.purple}
        accessibilityLabel={`Amount in ${token.symbol}`}
        accessibilityHint={`Enter amount of ${token.symbol} to swap`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    paddingVertical: spacing.sm,
  },
  inputDisabled: {
    color: colors.text.tertiary,
  },
});
