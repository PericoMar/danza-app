// import { useAuth } from "@/app/_layout";
// import { SMALL_SCREEN_BREAKPOINT } from "@/constants/layout";
// import { Ionicons } from "@expo/vector-icons";
// import { Link } from "expo-router";
// import { Pressable, useWindowDimensions, View, Text, StyleSheet, Platform } from "react-native";
// import { Colors } from "react-native/Libraries/NewAppScreen";

// // ---------- HeaderRight con contexto ----------
// export function RightHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
//   const { session } = useAuth();
//   const isLoggedIn = !!session;
//   const { width } = useWindowDimensions();
//   const isSmall = width < SMALL_SCREEN_BREAKPOINT;

//   if (isLoggedIn) {
//     return (
//       <View style={stylesHeader.container}>
//         <Pressable
//           onPress={onOpenMenu}
//           style={stylesHeader.iconButton}
//           accessibilityRole="button"
//           accessibilityLabel="Open menu"
//         >
//           <Ionicons
//             name="menu-outline"
//             size={28}
//             color={Colors.text}
//             style={Platform.OS === "web" ? { cursor: "pointer" } : undefined}
//           />
//         </Pressable>
//       </View>
//     );
//   }

//   // Guest header (no logged in)
//   return (
//     <View style={stylesHeader.container}>
//       {/* Home */}
//       <Link href="/home" asChild>
//         <Pressable
//           style={[
//             stylesHeader.chipBase,
//             stylesHeader.chipHome,
//             isSmall && stylesHeader.chipSmall,
//           ]}
//           accessibilityRole="button"
//           accessibilityLabel="Home"
//         >
//           <Ionicons name="home-outline" size={18} color={Colors.white} />
//           {!isSmall && (
//             <Text style={[stylesHeader.chipText, stylesHeader.chipTextLight]}>
//               Home
//             </Text>
//           )}
//         </Pressable>
//       </Link>

//       {/* Companies */}
//       <Link href="/companies" asChild>
//         <Pressable
//           style={[
//             stylesHeader.chipBase,
//             stylesHeader.chipCompanies,
//             isSmall && stylesHeader.chipSmall,
//           ]}
//           accessibilityRole="button"
//           accessibilityLabel="Companies"
//         >
//           <Ionicons
//             name="business-outline"
//             size={18}
//             color={Colors.purpleDark}
//           />
//           {!isSmall && (
//             <Text
//               style={[stylesHeader.chipText, stylesHeader.chipTextCompanies]}
//             >
//               Companies
//             </Text>
//           )}
//         </Pressable>
//       </Link>

//       {/* Login / Register */}
//       {isSmall ? (
//         // Solo icono "persona" en pantallas pequeñas
//         <Link href="/login" asChild>
//           <Pressable
//             style={[stylesHeader.iconButton, stylesHeader.itemSpacing]}
//             accessibilityRole="button"
//             accessibilityLabel="Login"
//           >
//             <Ionicons
//               name="person-outline"
//               size={18}
//               color={Colors.text}
//             />
//           </Pressable>
//         </Link>
//       ) : (
//         // En escritorio: enlaces de texto más corporativos
//         <>
//           <Link href="/login" asChild>
//             <Pressable style={[stylesHeader.textLink, stylesHeader.itemSpacing]}>
//               <Text style={stylesHeader.textLinkLabel}>Login</Text>
//             </Pressable>
//           </Link>
//           <Link href="/register" asChild>
//             <Pressable style={[stylesHeader.textLink, stylesHeader.itemSpacing]}>
//               <Text style={stylesHeader.textLinkLabel}>Register</Text>
//             </Pressable>
//           </Link>
//         </>
//       )}
//     </View>
//   );
// }

// const stylesHeader = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     marginRight: 10,
//     alignItems: "center",
//   },

//   // Espaciado horizontal entre items del header
//   itemSpacing: {
//     marginLeft: 8,
//   },

//   // Botón de icono simple (login móvil, menú)
//   iconButton: {
//     paddingHorizontal: 8,
//     paddingVertical: 6,
//     borderRadius: 999,
//     ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
//   },

//   // Base para los chips de navegación
//   chipBase: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 999,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderWidth: 1,
//     marginLeft: 8, // hace de "gap" entre chips
//     ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
//   },
//   chipSmall: {
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },

//   // Home → morado, texto blanco
//   chipHome: {
//     backgroundColor: Colors.purple,
//     borderColor: Colors.purpleDark,
//   },

//   // Companies → más corporativo, fondo suave, texto morado
//   chipCompanies: {
//     backgroundColor: Colors.surfaceAlt,
//     borderColor: Colors.purpleSoft,
//   },

//   chipText: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   chipTextLight: {
//     color: Colors.white,
//   },
//   chipTextCompanies: {
//     color: Colors.purpleDark,
//   },

//   // Login / Register texto
//   textLink: {
//     paddingHorizontal: 6,
//     paddingVertical: 4,
//     ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
//   },
//   textLinkLabel: {
//     fontSize: 14,
//     color: Colors.text,
//   },
// });