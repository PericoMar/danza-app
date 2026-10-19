import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '@/theme/colors';
import ScreenSchematic, { schematicStyles } from './ScreenSchematic';
import {
  PopupPlacement,
  PopupSurface,
  type NewsletterPopupCatalogEntry,
} from './newsletterPopupCatalog';

type NewsletterPopupThumbnailProps = Pick<
  NewsletterPopupCatalogEntry,
  'placement' | 'surface' | 'blocksPage'
>;

const POPUP_FRAME: Record<PopupPlacement, ViewStyle> = {
  [PopupPlacement.CENTER]: { top: '24%', bottom: '18%', left: '30%', right: '30%', borderRadius: 5 },
  [PopupPlacement.CORNER]: { bottom: '8%', right: '5%', width: '34%', height: '27%', borderRadius: 5 },
  [PopupPlacement.SHEET]: {
    bottom: 0,
    left: '20%',
    right: '20%',
    height: '50%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  [PopupPlacement.BANNER]: { top: '17%', right: '5%', width: '36%', height: '17%', borderRadius: 6 },
};

/** Where a popup design sits on the page and how much of it it takes. */
export default function NewsletterPopupThumbnail({
  placement,
  surface,
  blocksPage,
}: NewsletterPopupThumbnailProps) {
  const isDark = surface === PopupSurface.DARK;
  const line = [schematicStyles.line, isDark && schematicStyles.lineOnDark];

  return (
    <ScreenSchematic isDimmed={blocksPage}>
      <View style={[styles.popup, isDark && styles.popupDark, POPUP_FRAME[placement]]}>
        {surface === PopupSurface.PHOTO && <View style={styles.photo} />}
        <View style={[styles.popupBody, surface === PopupSurface.PHOTO && styles.popupBodyBeside]}>
          {surface === PopupSurface.INBOX && (
            <View style={styles.inbox}>
              {[0, 1, 2].map((row) => (
                <View key={row} style={styles.inboxRow}>
                  <View style={styles.inboxDot} />
                  <View style={styles.inboxLine} />
                </View>
              ))}
            </View>
          )}
          <View style={[line, { width: '70%' }]} />
          <View style={[line, { width: '50%' }]} />
          <View style={[styles.popupButton, isDark && styles.popupButtonDark]} />
        </View>
      </View>
    </ScreenSchematic>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  popupDark: {
    backgroundColor: Colors.dark2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  photo: {
    width: '42%',
    backgroundColor: Colors.grey1,
  },
  popupBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: '10%',
    gap: 3,
  },
  popupBodyBeside: {
    paddingHorizontal: '8%',
  },
  popupButton: {
    height: 5,
    width: '80%',
    marginTop: 2,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  popupButtonDark: {
    backgroundColor: Colors.silver,
  },
  inbox: {
    gap: 2,
    marginBottom: 3,
    padding: 3,
    borderRadius: 3,
    backgroundColor: Colors.specSurface,
  },
  inboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inboxDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.auditionOpen,
  },
  inboxLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.skeletonFill,
  },
});
