export default {
  "expo": {
    "name": "danza-app",
    "slug": "danza-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.danzaapp.mobile",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "NSCalendarsUsageDescription": "Danza App adds the audition deadlines and dates you choose to your calendar.",
        "NSCalendarsFullAccessUsageDescription": "Danza App adds the audition deadlines and dates you choose to your calendar.",
        "NSRemindersUsageDescription": "Danza App never reads or changes your reminders; it only adds audition dates to your calendar.",
        "NSRemindersFullAccessUsageDescription": "Danza App never reads or changes your reminders; it only adds audition dates to your calendar."
      }
    },
    "android": {
      "package": "com.danzaapp.mobile",
      "blockedPermissions": [
        "android.permission.READ_CALENDAR",
        "android.permission.WRITE_CALENDAR"
      ],
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://danza-app.com"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 36,
            "targetSdkVersion": 36
          }
        }
      ],
      "@react-native-community/datetimepicker",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Danza App needs access to your photos so you can upload an ad image."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "owner": "danzaapps-team",
    "extra": {
      "supabaseUrl": process.env.EXPO_PUBLIC_SUPABASE_URL,
      "supabaseAnonKey": process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      "eas": {
        "projectId": "40d965cc-2b91-409c-8385-ee3b20cc9814"
      }
    }
  }
}
