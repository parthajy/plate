import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { isToday } from 'date-fns';
import { fmtDateLabel } from '../../lib/formatters';
import { colors, type } from '../../lib/theme';

interface DateScrubberProps {
  date: Date;
  onChange: (d: Date) => void;
}

export function DateScrubber({ date, onChange }: DateScrubberProps) {
  const goPrev = () => onChange(new Date(date.getTime() - 24 * 60 * 60 * 1000));
  const goNext = () => onChange(new Date(date.getTime() + 24 * 60 * 60 * 1000));
  const canGoNext = !isToday(date);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <Pressable onPress={goPrev} hitSlop={12} accessibilityLabel="Previous day">
        <ChevronLeft color={colors.text2} size={22} />
      </Pressable>
      <Text style={[type.label, { color: colors.text, fontSize: 14 }]}>{fmtDateLabel(date)}</Text>
      <Pressable
        onPress={canGoNext ? goNext : undefined}
        hitSlop={12}
        accessibilityLabel="Next day"
        accessibilityState={{ disabled: !canGoNext }}
      >
        <ChevronRight color={canGoNext ? colors.text2 : colors.text3} size={22} />
      </Pressable>
    </View>
  );
}
