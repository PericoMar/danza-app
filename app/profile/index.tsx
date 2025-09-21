import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    Image,
    Switch,
    Pressable
  } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import { supabase } from '@/services/supabase';
  import { useEffect, useState } from 'react';
  import Snackbar from '@/components/Snackbar';
  import AvatarPickerModal from '@/components/modals/AvatarPickerModal';
  
  export default function ProfileScreen() {
    const [snackbar, setSnackbar] = useState<{
      message: string;
      color?: string;
      iconName?: keyof typeof Ionicons.glyphMap;
    } | null>(null);
  
    const [user, setUser] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [displayLocalTime, setDisplayLocalTime] = useState(false);
    const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  
    const [formData, setFormData] = useState({
      name: '',
      bio: '',
      company: '',
      location: '',
      website: '',
      instagram: '',
      linkedin: '',
    });
  
    useEffect(() => {
      const fetchUser = async () => {
        const { data } = await supabase.auth.getUser();
        setUser(data?.user || null);
  
        if (data?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
  
          if (userProfile) {
            setFormData({
              name: userProfile.name || '',
              bio: userProfile.bio || '',
              company: userProfile.company || '',
              location: userProfile.location || '',
              website: userProfile.website_url || '',
              instagram: userProfile.instagram_url || '',
              linkedin: userProfile.linkedin_url || '',
            });
            setGender(userProfile.gender || null);
            setDisplayLocalTime(userProfile.display_local_time || false);
            setAvatarUrl(userProfile.profile_img || null);
          }
        }
      };
  
      fetchUser();
    }, []);
  
    const handleChange = (key: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    };
  
    const handleSave = async () => {
      if (!user) return;
  
      const { error } = await supabase.from('users').upsert({
        user_id: user.id,
        name: formData.name,
        bio: formData.bio,
        company: formData.company,
        location: formData.location,
        website_url: formData.website,
        instagram_url: formData.instagram,
        linkedin_url: formData.linkedin,
        gender: gender,
        display_local_time: displayLocalTime,
        profile_img: avatarUrl || user.user_metadata?.avatar_url || null,
      });
  
      if (error) {
        setSnackbar({
          message: 'Error saving profile. Please try again.',
          color: '#EF4444',
          iconName: 'close-circle-outline',
        });
      } else {
        setSnackbar({
          message: 'Profile updated successfully!',
          color: '#22C55E',
          iconName: 'checkmark-circle-outline',
        });
      }
    };
  
    const renderInput = (
      iconName: any,
      placeholder: string,
      value: string,
      onChangeText: (text: string) => void
    ) => (
      <View style={styles.inputContainer}>
        <Ionicons name={iconName} size={18} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    );
  
    return (
      <View style={styles.screen}>
        {snackbar && (
          <Snackbar
            message={snackbar.message}
            color={snackbar.color}
            iconName={snackbar.iconName}
            duration={3000}
            onClose={() => setSnackbar(null)}
          />
        )}
  
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.content}>
            {/* Avatar */}
            <Pressable
              style={styles.avatarContainer}
              onPress={() => setModalVisible(true)}
            >
              <Image
                source={{
                  uri:
                    avatarUrl ||
                    user?.user_metadata?.avatar_url ||
                    'https://i.pravatar.cc/150?img=3',
                }}
                style={styles.avatar}
              />
            </Pressable>
  
            {/* Inputs */}
            <Text style={styles.sectionTitle}>Full name</Text>
            {renderInput('person-outline', 'Your name', formData.name, (text) =>
              handleChange('name', text)
            )}
  
            <Text style={styles.sectionTitle}>Bio</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#888"
                style={styles.icon}
              />
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Add a bio"
                placeholderTextColor="#aaa"
                value={formData.bio}
                onChangeText={(text) => handleChange('bio', text)}
                multiline
              />
            </View>
  
            <Text style={styles.sectionTitle}>Gender</Text>
            <View style={styles.genderContainer}>
              {['male', 'female', 'other'].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.radio,
                    gender === option && styles.radioSelected,
                  ]}
                  onPress={() =>
                    setGender(option as 'male' | 'female' | 'other')
                  }
                >
                  <Text
                    style={{
                      color: gender === option ? '#000' : '#555',
                    }}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
  
            <Text style={styles.sectionTitle}>Company</Text>
            {renderInput('business-outline', 'Company', formData.company, (text) =>
              handleChange('company', text)
            )}
  
            <Text style={styles.sectionTitle}>Location</Text>
            {renderInput('location-outline', 'Location', formData.location, (text) =>
              handleChange('location', text)
            )}
  
            <View style={styles.switchContainer}>
              <Switch
                value={displayLocalTime}
                onValueChange={setDisplayLocalTime}
              />
              <Text style={styles.switchLabel}>Display current local time</Text>
            </View>
  
            <Text style={styles.sectionTitle}>Website</Text>
            {renderInput('globe-outline', 'Website', formData.website, (text) =>
              handleChange('website', text)
            )}
  
            <Text style={styles.sectionTitle}>Social Accounts</Text>
            {renderInput('logo-instagram', 'Instagram URL', formData.instagram, (text) =>
              handleChange('instagram', text)
            )}
            {renderInput('logo-linkedin', 'LinkedIn URL', formData.linkedin, (text) =>
              handleChange('linkedin', text)
            )}
  
            <View style={styles.spacer} />
          </View>
        </ScrollView>
  
        {/* Footer Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
        </View>
  
        {/* Avatar Picker Modal */}
        <AvatarPickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={(url) => {
            setAvatarUrl(url);
            setModalVisible(false);
          }}
        />
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#fff',
    },
    container: {
      flexGrow: 1,
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    content: {
      width: '100%',
      maxWidth: 400,
    },
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#eee',
    },
    sectionTitle: {
      marginTop: 16,
      fontWeight: 'bold',
      fontSize: 14,
      color: '#555',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingHorizontal: 12,
      marginTop: 6,
      borderWidth: 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    icon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 10,
      color: '#000',
    },
    bioInput: {
      height: 80,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    radio: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#ccc',
    },
    radioSelected: {
      borderColor: '#000',
      backgroundColor: '#eee',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 8,
    },
    switchLabel: {
      fontSize: 14,
      color: '#555',
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 10,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    saveButton: {
      backgroundColor: 'black',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginRight: '20%',
    },
    saveButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    cancelButton: {
      backgroundColor: '#f0f0f0',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: '#333',
      fontWeight: 'bold',
    },
    spacer: {
      height: 120,
    },
  });
  