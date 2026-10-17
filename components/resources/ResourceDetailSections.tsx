import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER } from '@/theme/companies';
import {
  PHOTOGRAPHY_WORK_TYPE_COPY,
  STUDENT_GOAL_COPY,
} from '@/constants/resourceOnboarding';
import { Resource, ResourceField, ResourceTypeField } from '@/types/resource';
import { fieldCopy } from '@/utils/resourceOnboarding';

interface ResourceDetailSectionsProps {
  resource: Resource;
  typeFields: ResourceTypeField[];
}

/**
 * Lo que cuenta una ficha de sí misma, en el orden en que se le preguntó.
 *
 * Recorre `resource_type_fields` igual que el formulario, así que un tipo
 * nuevo o un campo nuevo aparecen aquí sin tocar esta pantalla. Los campos que
 * ya pinta la cabecera (nombre, logo, país, región, dirección, contacto) se
 * saltan.
 */
const IN_HEADER: ResourceField[] = [
  ResourceField.NAME,
  ResourceField.LOGO,
  ResourceField.COUNTRY,
  ResourceField.REGION,
  ResourceField.ADDRESS,
  ResourceField.EMAILS,
  ResourceField.WEBSITE_URL,
  ResourceField.INSTAGRAM_URL,
  ResourceField.FACEBOOK_URL,
  ResourceField.DESCRIPTION,
];

export default function ResourceDetailSections({
  resource,
  typeFields,
}: ResourceDetailSectionsProps) {
  const sections = typeFields.filter((f) => !IN_HEADER.includes(f.field));

  return (
    <View style={styles.wrap}>
      {sections.map((field) => {
        const content = valueOf(resource, field.field);
        if (content === null) return null;

        return (
          <View key={field.field} style={styles.section}>
            <Text style={styles.label}>{fieldCopy(resource.type, field.field).label}</Text>
            {content}
          </View>
        );
      })}
    </View>
  );
}

/**
 * El valor de un campo, ya pintado. Es el espejo de lectura de
 * `OnboardingField`: el mismo enum, los mismos campos, pero sin inputs.
 * Devuelve null cuando no hay nada que mostrar, y entonces la sección entera
 * desaparece.
 */
function valueOf(resource: Resource, field: ResourceField) {
  const paragraph = (value: string | null) =>
    value && value.trim() !== '' ? <Text style={styles.body}>{value}</Text> : null;

  switch (field) {
    case ResourceField.FOUNDED_YEAR:
      return resource.founded_year ? <Text style={styles.body}>{resource.founded_year}</Text> : null;

    case ResourceField.FOUNDER_NAME:
      return paragraph(resource.founder_name);

    case ResourceField.PROFESSIONAL_EXPERIENCE:
      return paragraph(resource.professional_experience);

    case ResourceField.TEACHING_METHOD:
      return paragraph(resource.teaching_method);

    case ResourceField.SPECIALIZATION:
      return paragraph(resource.specialization);

    case ResourceField.RELATION_TO_DANCE:
      return paragraph(resource.relation_to_dance);

    case ResourceField.CLASS_STYLE:
      return paragraph(resource.class_style);

    case ResourceField.DISCIPLINES:
      return resource.disciplines.length > 0 ? (
        <Tags values={resource.disciplines.map((d) => d.name)} />
      ) : null;

    case ResourceField.STUDENT_GOALS:
      return resource.student_goals.length > 0 ? (
        <Tags values={resource.student_goals.map((goal) => STUDENT_GOAL_COPY[goal].title)} />
      ) : null;

    case ResourceField.PHOTOGRAPHY_WORK_TYPES:
      return resource.photography_work_types.length > 0 ? (
        <Tags values={resource.photography_work_types.map((w) => PHOTOGRAPHY_WORK_TYPE_COPY[w].title)} />
      ) : null;

    case ResourceField.IMAGES:
      return resource.images.length > 0 ? (
        <View style={styles.gallery}>
          {resource.images.map((image) => (
            <Image
              key={image.id}
              source={{ uri: image.image_url }}
              style={styles.galleryImage}
              resizeMode="cover"
              accessibilityLabel={image.caption ?? undefined}
            />
          ))}
        </View>
      ) : null;

    // Los demás los pinta la cabecera de la ficha.
    default:
      return null;
  }
}

function Tags({ values }: { values: string[] }) {
  return (
    <View style={styles.tags}>
      {values.map((value) => (
        <View key={value} style={styles.tag}>
          <Text style={styles.tagLabel}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 28,
  },
  section: {
    gap: 10,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  label: {
    fontFamily: DISPLAY,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.text,
  },
  body: {
    fontFamily: INTER,
    fontSize: 15.5,
    lineHeight: 24,
    color: Colors.textLightDark,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.ruleStrong,
  },
  tagLabel: {
    fontFamily: INTER,
    fontSize: 13,
    color: Colors.text,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  galleryImage: {
    width: 180,
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
  },
});
