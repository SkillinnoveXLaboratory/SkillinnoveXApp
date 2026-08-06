import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormField } from '@/components/ui/FormField';
import { colors, radii } from '@/constants/theme';

export interface RepeatableFieldDefinition {
  key: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

interface RepeatableFieldsProps<T extends Record<string, string>> {
  values: T[];
  fields: RepeatableFieldDefinition[];
  itemLabel: string;
  onChange: (values: T[]) => void;
  maxItems?: number;
}

export function RepeatableFields<T extends Record<string, string>>({ values, fields, itemLabel, onChange, maxItems }: RepeatableFieldsProps<T>) {
  const add = () => onChange([...values, Object.fromEntries(fields.map((field) => [field.key, ''])) as T]);
  const update = (index: number, key: string, value: string) => {
    onChange(values.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry));
  };
  const remove = (index: number) => onChange(values.filter((_, entryIndex) => entryIndex !== index));

  return (
    <View>
      {values.map((entry, index) => (
        <View key={`${itemLabel}-${index}`} style={styles.item}>
          <View style={styles.heading}>
            <Text style={styles.itemTitle}>{itemLabel} {index + 1}</Text>
            {values.length > 1 && (
              <Pressable onPress={() => remove(index)} style={styles.remove}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </Pressable>
            )}
          </View>
          {fields.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={entry[field.key] || ''}
              onChangeText={(value) => update(index, field.key, value)}
              multiline={field.multiline}
            />
          ))}
        </View>
      ))}
      {(!maxItems || values.length < maxItems) && (
        <Pressable onPress={add} style={styles.add}>
          <Ionicons name="add-circle-outline" size={19} color={colors.blue} />
          <Text style={styles.addText}>Add another {itemLabel.toLowerCase()}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderBottomWidth: 1, borderBottomColor: '#EAF0F7', marginBottom: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  itemTitle: { color: colors.blueDeep, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  remove: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center' },
  add: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.blueSoft, padding: 12 },
  addText: { color: colors.blueDeep, fontSize: 12, fontWeight: '900' },
});
