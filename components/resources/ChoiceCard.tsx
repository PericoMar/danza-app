import { ComponentProps, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme/colors';
import { DISPLAY, INTER } from '@/theme/companies';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ChoiceCardProps {
  title: string;
  description?: string;
  icon?: IconName;
  selected?: boolean;
  onPress: () => void;
  /** Posición en la lista: escalona la entrada para que no aparezcan de golpe. */
  index?: number;
  /** Flecha que avanza al pasar por encima: para una elección que lleva a otra pantalla. */
  showArrow?: boolean;
  /** Tarjeta grande, para cuando la elección es la pantalla entera (el registro). */
  size?: 'default' | 'large';
}

const ENTER_MS = 420;
const STAGGER_MS = 90;

/**
 * Una tarjeta que se elige. La usan los dos tipos de cuenta y los ocho tipos de
 * recurso: un clic, sin teclado, que es lo que hace que las dos primeras
 * pantallas del alta se pasen sin pensar.
 *
 * El movimiento no es decoración: entra escalonada para que el ojo recorra las
 * opciones en orden, se levanta al pasar por encima para decir "esto se pulsa",
 * y se hunde al pulsar para confirmar que te ha oído. En el registro es donde
 * se pierde gente, así que la pantalla tiene que sentirse viva.
 */
export default function ChoiceCard({
  title,
  description,
  icon,
  selected,
  onPress,
  index = 0,
  showArrow = false,
  size = 'default',
}: ChoiceCardProps) {
  const [hovered, setHovered] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      delay: index * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const animate = (value: Animated.Value, toValue: number) =>
    Animated.spring(value, {
      toValue,
      friction: 9,
      tension: 120,
      useNativeDriver: true,
    }).start();

  const large = size === 'large';

  return (
    <Animated.View
      style={[
        styles.wrap,
        large ? styles.wrapLarge : styles.wrapDefault,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
            { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
            { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onHoverIn={() => {
          setHovered(true);
          animate(lift, 1);
        }}
        onHoverOut={() => {
          setHovered(false);
          animate(lift, 0);
        }}
        onPressIn={() => animate(press, 1)}
        onPressOut={() => animate(press, 0)}
        accessibilityRole="button"
        accessibilityState={{ selected: Boolean(selected) }}
        style={[
          styles.card,
          large && styles.cardLarge,
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
          hovered && !selected && styles.cardHovered,
          selected && styles.cardSelected,
        ]}
      >
        <View style={styles.head}>
          {icon ? (
            <View
              style={[
                styles.iconWrap,
                large && styles.iconWrapLarge,
                (selected || hovered) && styles.iconWrapActive,
              ]}
            >
              <Ionicons
                name={icon}
                size={large ? 24 : 20}
                color={selected || hovered ? Colors.white : Colors.text}
              />
            </View>
          ) : null}

          {showArrow ? (
            <Animated.View
              style={{
                transform: [
                  { translateX: lift.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) },
                ],
              }}
            >
              <Ionicons
                name="arrow-forward"
                size={18}
                color={selected ? Colors.white : hovered ? Colors.text : Colors.textMuted}
              />
            </Animated.View>
          ) : null}
        </View>

        <Text style={[styles.title, large && styles.titleLarge, selected && styles.titleSelected]}>
          {title}
        </Text>

        {description ? (
          <Text
            style={[
              styles.description,
              large && styles.descriptionLarge,
              selected && styles.descriptionSelected,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Va dentro de una fila con wrap, así que `flexGrow` reparte ANCHO y las
  // hermanas de una misma línea igualan altura. Ojo al cambiar de contenedor:
  // en una columna, `flexGrow` repartiría el ALTO y las tarjetas quedarían
  // estiradas y medio vacías.
  wrap: {
    flexGrow: 1,
    flexShrink: 1,
  },
  wrapDefault: {
    flexBasis: 220,
    minWidth: 200,
  },
  wrapLarge: {
    flexBasis: 250,
    minWidth: 230,
  },
  card: {
    // Llena el contenedor animado: en una fila, las hermanas igualan altura y
    // la tarjeta tiene que pintar su fondo hasta abajo.
    flex: 1,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.silverSoft,
    backgroundColor: Colors.white,
    gap: 8,
    ...Platform.select({
      web: { transitionProperty: 'border-color, background-color', transitionDuration: '160ms' } as any,
      default: {},
    }),
  },
  cardLarge: {
    padding: 24,
    gap: 10,
  },
  cardHovered: {
    borderColor: Colors.silver,
    ...Platform.select({
      web: { boxShadow: '0 22px 48px -24px rgba(0,0,0,.22)' } as any,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 3,
      },
    }),
  },
  cardSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.chromeSoft,
    ...Platform.select({
      web: { transitionProperty: 'background-color', transitionDuration: '160ms' } as any,
      default: {},
    }),
  },
  iconWrapLarge: {
    width: 46,
    height: 46,
  },
  iconWrapActive: {
    backgroundColor: Colors.text,
  },
  title: {
    fontFamily: DISPLAY,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: Colors.text,
  },
  titleLarge: {
    fontSize: 20,
    letterSpacing: -0.5,
  },
  titleSelected: {
    color: Colors.white,
  },
  description: {
    fontFamily: INTER,
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.textLightDark,
  },
  descriptionLarge: {
    fontSize: 15,
    lineHeight: 22,
  },
  descriptionSelected: {
    color: 'rgba(255,255,255,0.72)',
  },
});
