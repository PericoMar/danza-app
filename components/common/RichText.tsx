// components/common/RichText.tsx
// Pinta un texto con formato (títulos, negrita, cursiva, listas, enlaces).
// La sintaxis y cómo se lee el texto antiguo: utils/richText.ts.
import React, { useMemo } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { RichTextBlockType } from "@/constants/richText";
import { Colors } from "@/theme/colors";
import { INTER } from "@/theme/insights";
import { parseRichText, type RichTextBlock, type RichTextSpan } from "@/utils/richText";

/** Interlineado del cuerpo: lo necesita quien recorta el texto a unas líneas. */
export const RICH_TEXT_LINE_HEIGHT = 23;
/** Hueco que deja una línea en blanco. */
const PARAGRAPH_GAP = 12;
/** Sobre un título: tras una línea en blanco, o justo debajo de otra línea. */
const HEADING_GAP = 20;
const HEADING_GAP_TIGHT = 8;

type Props = {
  text: string;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
};

function openLink(href: string) {
  Linking.openURL(href).catch(() => {});
}

function Spans({ spans }: { spans: RichTextSpan[] }) {
  return (
    <>
      {spans.map((span, i) => {
        const { href } = span;
        return (
          <Text
            key={i}
            style={[span.bold && styles.bold, span.italic && styles.italic, !!href && styles.link]}
            onPress={href ? () => openLink(href) : undefined}
            accessibilityRole={href ? "link" : undefined}
          >
            {span.text}
          </Text>
        );
      })}
    </>
  );
}

function gapBefore(block: RichTextBlock, index: number): number {
  if (index === 0) return 0;
  if (block.type === RichTextBlockType.HEADING) return block.spaced ? HEADING_GAP : HEADING_GAP_TIGHT;
  return block.spaced ? PARAGRAPH_GAP : 0;
}

function Block({ block }: { block: RichTextBlock }) {
  switch (block.type) {
    case RichTextBlockType.HEADING:
      return (
        <Text style={block.level === 2 ? styles.heading2 : styles.heading3} accessibilityRole="header">
          <Spans spans={block.spans} />
        </Text>
      );
    case RichTextBlockType.PARAGRAPH:
      return (
        <Text style={styles.body}>
          {block.lines.map((spans, i) => (
            <React.Fragment key={i}>
              {i > 0 && "\n"}
              <Spans spans={spans} />
            </React.Fragment>
          ))}
        </Text>
      );
    case RichTextBlockType.LIST:
      return (
        <View>
          {block.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <Text style={[styles.body, block.ordered ? styles.number : styles.bullet]}>{item.marker}</Text>
              <Text style={[styles.body, styles.itemText]}>
                <Spans spans={item.spans} />
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

export default function RichText({ text, style, onLayout }: Props) {
  const blocks = useMemo(() => parseRichText(text), [text]);
  return (
    <View style={style} onLayout={onLayout}>
      {blocks.map((block, i) => (
        <View key={i} style={{ marginTop: gapBefore(block, i) }}>
          <Block block={block} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: INTER,
    fontSize: 14.5,
    lineHeight: RICH_TEXT_LINE_HEIGHT,
    color: Colors.textLightDark,
  },
  heading2: {
    fontFamily: INTER,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Colors.text,
  },
  heading3: {
    fontFamily: INTER,
    fontSize: 15.5,
    lineHeight: RICH_TEXT_LINE_HEIGHT,
    fontWeight: "600",
    color: Colors.text,
  },
  bold: { fontWeight: "700" },
  italic: { fontStyle: "italic" },
  link: {
    color: Colors.pinkDark,
    textDecorationLine: "underline",
    textDecorationColor: Colors.pinkSoft,
  },
  item: { flexDirection: "row" },
  bullet: { width: 16 },
  number: { minWidth: 24, paddingRight: 6 },
  itemText: { flex: 1 },
});
