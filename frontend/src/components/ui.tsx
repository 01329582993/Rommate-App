import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, TextInputProps, ActivityIndicator, StyleProp, ViewStyle, TextStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search } from 'lucide-react-native';
import { Theme, shadow, type, avatarColors, gradients } from '../theme';
import { initials } from '../reviewApi';

// ---------- layout ----------
export function Screen({ children, edges = ['top'], style }: { children: React.ReactNode; edges?: Edge[]; style?: StyleProp<ViewStyle> }) {
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: Theme.colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

/** Centres content and caps its width so screens look right on tablets and web. */
export function Content({ children, style, wide }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; wide?: boolean }) {
  return <View style={[{ width: '100%', maxWidth: wide ? 1040 : 720, alignSelf: 'center' }, style]}>{children}</View>;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const base = [styles.card, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

// ---------- header ----------
export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {!!subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
        <Text style={type.display} numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.heading}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------- avatar ----------
export function Avatar({ name, size = 44, ring }: { name: string; size?: number; ring?: boolean }) {
  const colors = avatarColors(name || '?');
  return (
    <View style={ring ? { padding: 3, borderRadius: size, backgroundColor: '#fff', ...shadow.md } : undefined}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36, letterSpacing: 0.5 }}>{initials(name)}</Text>
      </LinearGradient>
    </View>
  );
}

// ---------- buttons ----------
type Variant = 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';

export function Button({
  title, onPress, variant = 'primary', loading, disabled, icon, style, compact,
}: {
  title: string; onPress?: () => void; variant?: Variant; loading?: boolean; disabled?: boolean;
  icon?: React.ReactNode; style?: StyleProp<ViewStyle>; compact?: boolean;
}) {
  const v = buttonVariants[variant];
  const content = (
    <View style={styles.btnRow}>
      {loading ? <ActivityIndicator color={v.text} /> : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: v.text }, compact && { fontSize: 14 }]}>{title}</Text>
        </>
      )}
    </View>
  );
  const sizeStyle = { height: compact ? 42 : 54, borderRadius: compact ? 21 : 27 };
  const off = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={off} style={({ pressed }) => [sizeStyle, shadow.md, off && { opacity: 0.6 }, pressed && styles.pressed, style]}>
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btnFill, sizeStyle]}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.btnFill, sizeStyle, { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 }, off && { opacity: 0.6 }, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const buttonVariants: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Theme.colors.primary, text: '#fff' },
  secondary: { bg: '#fff', text: Theme.colors.text, border: Theme.colors.border },
  soft: { bg: Theme.colors.primarySoft, text: Theme.colors.primary },
  danger: { bg: Theme.colors.errorSoft, text: '#B91C1C' },
  ghost: { bg: 'transparent', text: Theme.colors.textSecondary },
};

export function IconButton({ children, onPress, size = 40, style, label }: { children: React.ReactNode; onPress?: () => void; size?: number; style?: StyleProp<ViewStyle>; label?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', ...shadow.sm }, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

// ---------- chips / pills ----------
export function Chip({ label, bg = Theme.colors.primarySoft, fg = Theme.colors.primary, icon }: { label: string; bg?: string; fg?: string; icon?: React.ReactNode }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function OptionPills<T extends string | number | boolean>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.pills}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.pill, active && styles.pillActive]}>
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- inputs ----------
export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder?: string }) {
  return (
    <View style={styles.search}>
      <Search size={18} color={Theme.colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Search'}
        placeholderTextColor={Theme.colors.textMuted}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

export function Field({ label, icon, right, style, ...props }: TextInputProps & { label?: string; icon?: React.ReactNode; right?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      {!!label && <Text style={[type.label, { marginBottom: 8 }]}>{label}</Text>}
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {icon}
        <TextInput
          placeholderTextColor={Theme.colors.textMuted}
          {...props}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={[styles.fieldInput, style as StyleProp<TextStyle>]}
        />
        {right}
      </View>
    </View>
  );
}

// ---------- empty state ----------
export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={[type.heading, { textAlign: 'center' }]}>{title}</Text>
      {!!text && <Text style={[type.secondary, { textAlign: 'center', marginTop: 6, maxWidth: 320 }]}>{text}</Text>}
      {action && <View style={{ marginTop: 20, alignSelf: 'stretch', maxWidth: 320 }}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  card: { backgroundColor: Theme.colors.surface, borderRadius: Theme.roundness.large, padding: 18, ...shadow.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 14 },
  headerSub: { fontSize: 13, fontWeight: '700', color: Theme.colors.primary, marginBottom: 2, letterSpacing: 0.3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionAction: { fontSize: 14, fontWeight: '700', color: Theme.colors.primary },
  btnFill: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pill: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: Theme.colors.border },
  pillActive: { backgroundColor: Theme.colors.primarySoft, borderColor: Theme.colors.primary },
  pillText: { fontSize: 14, fontWeight: '600', color: Theme.colors.textSecondary },
  pillTextActive: { color: Theme.colors.primary, fontWeight: '700' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, height: 50, ...shadow.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border },
  searchInput: { flex: 1, fontSize: 15, color: Theme.colors.text, height: '100%' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 16, height: 54 },
  fieldFocused: { borderColor: Theme.colors.primary, backgroundColor: '#FAFAFF' },
  fieldInput: { flex: 1, fontSize: 16, color: Theme.colors.text, height: '100%' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: Theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
});
