import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type } from '../lib/theme';

export default function Home() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const stamp = now
    .toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    .toUpperCase();

  return (
    <View
      className="flex-1 bg-bg px-5"
      style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}
    >
      <Text style={[type.monoSm, { color: colors.text3, letterSpacing: 1.2 }]}>
        {stamp} · PHASE 0
      </Text>

      <View className="mt-6">
        <Text style={[type.display1, { color: colors.text }]}>
          Hello,{' '}
          <Text style={{ color: colors.accent, fontStyle: 'italic' }}>PLATE</Text>.
        </Text>
        <Text style={[type.body, { color: colors.text2, marginTop: 12 }]}>
          Foundations are in. Backend boots, mobile renders.
        </Text>
        <Text style={[type.body, { color: colors.text3, marginTop: 4 }]}>
          Next up: auth, onboarding, the Today screen.
        </Text>
      </View>

      <View className="mt-auto">
        <View
          className="rounded-lg border border-border p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text style={[type.labelSm, { color: colors.text3, letterSpacing: 1.2 }]}>
            DEBUG
          </Text>
          <Text style={[type.body, { color: colors.text, marginTop: 6 }]}>
            API target:{' '}
            <Text style={[type.mono, { color: colors.accent }]}>api.plate.best</Text>
          </Text>
          <Text style={[type.body, { color: colors.text2 }]}>Bundle: best.plate.app</Text>
        </View>
      </View>
    </View>
  );
}
