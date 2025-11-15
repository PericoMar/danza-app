import { View, Pressable, Linking, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Helper: ensure we have a protocol
function ensureProtocol(url?: string | null) {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function openExternal(url: string) {
    // Linking.openURL abre nueva pestaña en web y navegador externo en móvil
    Linking.openURL(url).catch(() => {
        console.warn("Failed to open url:", url);
    });
}

type SocialProps = {
    website?: string | null;
    instagram?: string | null; // e.g. https://instagram.com/username o solo username
    facebook?: string | null;  // e.g. https://facebook.com/page o solo page
};

export default function SocialLinks({ website, instagram, facebook }: SocialProps) {
    // Permite pasar solo el usuario y construimos la URL si hace falta
    const siteUrl = ensureProtocol(website);

    const igUrl = (() => {
        if (!instagram) return null;
        const hasProto = /^https?:\/\//i.test(instagram);
        if (hasProto) return ensureProtocol(instagram);
        return `https://instagram.com/${instagram.replace(/^@/, "")}`;
    })();

    const fbUrl = (() => {
        if (!facebook) return null;
        const hasProto = /^https?:\/\//i.test(facebook);
        if (hasProto) return ensureProtocol(facebook);
        return `https://facebook.com/${facebook}`;
    })();

    const items: { key: string; icon: keyof typeof Ionicons.glyphMap; url: string; label: string }[] = [];
    if (siteUrl) items.push({ key: "web", icon: "globe-outline", url: siteUrl, label: "Abrir sitio web" });
    if (igUrl) items.push({ key: "instagram", icon: "logo-instagram", url: igUrl, label: "Abrir Instagram" });
    if (fbUrl) items.push({ key: "facebook", icon: "logo-facebook", url: fbUrl, label: "Abrir Facebook" });

    if (items.length === 0) return null;

    return (
        <View style={styles.socialsContainer}>
            {items.map(({ key, icon, url, label }) => (
                <Pressable
                    key={key}
                    onPress={() => openExternal(url)}
                    accessibilityRole="link"
                    accessibilityLabel={label}
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.socialButton,
                        pressed && styles.socialButtonPressed,
                    ]}
                >
                    <Ionicons name={icon} size={20} color="#1f2937" />
                    {/* Texto opcional: si quieres mostrar nombre */}
                    {/* <Text style={styles.socialText}>{key}</Text> */}
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    socialsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,            // RN nuevo; si no, usa marginRight en cada hijo
    },
    socialButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f3f4f6",
        // accesible con contraste; cámbialo a tu theme
    },
    socialButtonPressed: {
        opacity: 0.6,
    },
    socialText: {
        marginLeft: 6,
        fontSize: 12,
        color: "#374151",
    },
});