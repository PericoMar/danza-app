import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  Animated,
  Easing,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccordionBox from '../ui/AccordionBox';
import { Modal, Portal } from 'react-native-paper';
import VisibilityTags, { VisibilityType } from '../ui/VisibilityTags';
import { MAX_NEW_REVIEW_MODAL_HEIGHT_RATIO } from '@/constants/layout';
import ConfirmSubmitModal from './ConfirmSubmitModal';
import { REVIEW_FIELDS, ReviewFieldKey } from '@/constants/fields';
import StarRating from 'react-native-star-rating-widget';

export type ReviewMode = 'create' | 'edit';

export enum ReviewModesEnum {
  CREATE = 'create',
  EDIT = 'edit',
}

interface NewReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: {
      salary: string; repertoire: string; staff: string; schedule: string;
      facilities: string; colleagues: string; city: string;
    };
    visibility_type: VisibilityType;
    rating: number;
  }) => void;
  /** "create" | "edit" (default "create") */
  mode?: ReviewMode;
  /** Optional custom label for the submit button */
  submitLabel?: string;
  /** Initial values when editing */
  initial?: {
    content?: Partial<Record<ReviewFieldKey, string>>;
    visibility_type?: VisibilityType;
    rating?: number;
  } | null;
}


export default function NewReviewModal({
  visible,
  onClose,
  onSubmit,
  mode = ReviewModesEnum.CREATE,
  submitLabel,
  initial,
}: NewReviewModalProps) {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const windowHeight = Dimensions.get('window').height;

  const [salary, setSalary] = useState('');
  const [repertoire, setRepertoire] = useState('');
  const [staff, setStaff] = useState('');
  const [schedule, setSchedule] = useState('');
  const [facilities, setFacilities] = useState('');
  const [colleagues, setColleagues] = useState('');
  const [city, setCity] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>('anonymous');
  const [rating, setRating] = useState(0);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const values: Record<ReviewFieldKey, string> = {
    salary, repertoire, staff, schedule, facilities, colleagues, city
  };

  const checkMissingFields = (): string[] => {
    return REVIEW_FIELDS
      .filter(f => !values[f.key]?.trim())
      .map(f => f.label);
  };

  const attemptSubmit = () => {
    const missing = checkMissingFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setConfirmModalVisible(true);
    } else {
      handleSubmit();
    }
  };

  const confirmSubmit = () => {
    setConfirmModalVisible(false);
    handleSubmit();
  };

  const handleSubmit = () => {
    const effectiveVisibility = visibility || 'anonymous';

    const content = {
      salary,
      repertoire,
      staff,
      schedule,
      facilities,
      colleagues,
      city,
    };

    onSubmit({
      content,
      visibility_type: effectiveVisibility,
      rating
    });

    onClose();
  };

  useEffect(() => {
    if (visible) {
      if (mode === ReviewModesEnum.EDIT && initial) {
        setSalary(initial.content?.salary ?? '');
        setRepertoire(initial.content?.repertoire ?? '');
        setStaff(initial.content?.staff ?? '');
        setSchedule(initial.content?.schedule ?? '');
        setFacilities(initial.content?.facilities ?? '');
        setColleagues(initial.content?.colleagues ?? '');
        setCity(initial.content?.city ?? '');
        setVisibility(initial.visibility_type ?? 'anonymous');
        setRating(initial.rating ?? 0);
      }
    }
  }, [visible, mode, initial]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(50);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalWrapper}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: opacityAnim,
              width: width > 900 ? '80%' : '100%',
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>{mode === ReviewModesEnum.EDIT ? 'Edit review' : 'New review'}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="black" />
            </Pressable>
          </View>

          <View style={[styles.scrollContainer, { maxHeight: windowHeight * MAX_NEW_REVIEW_MODAL_HEIGHT_RATIO }]}>
            <Animated.ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
            >

              <View style={styles.disclaimerContainer}>
                <Ionicons name="information-circle-outline" size={14} color="#888" style={{ marginRight: 4, marginTop: 2 }} />
                <Text style={styles.disclaimerText}>
                  Every field is optional. Share only what you feel comfortable with — your experience helps others.
                </Text>
              </View>

              <AccordionBox
                title="Salary & Compensation"
                description="Mention your salary (monthly or yearly), whether it’s gross or net, the currency, and if you receive extras or housing."
                placeholder="€ Monthly / Yearly salary"
                iconName="cash-outline"
                toolboxInfo="Indicate your salary (monthly or yearly), whether it’s gross or net, and specify the currency. Mention any extras (performances, tours, operas, etc.) and whether the company provides housing or support with accommodation. Include salary ranges by position if known, and add any other relevant details."
                value={salary}
                onChangeText={setSalary}
              />

              <AccordionBox
                title="Repertoire, Operas, Touring & Roles"
                description="Describe the repertoire, whether there are new creations or guest choreographers. Mention if there are operas and tours, and how roles are assigned (fairness, balance, transparency)."
                placeholder="Describe repertoire, tours, operas, and role assignments"
                iconName="musical-notes-outline"
                toolboxInfo="Describe the company’s repertoire (classical, contemporary, new works, guest choreographers, etc.). Mention whether the company does operas, how many, what kind of roles are involved, and how it affects overall scheduling. If the company tours, include how often and under what conditions. Briefly explain how roles are assigned and whether the system seems fair and balanced in relation to the workload."
                value={repertoire}
                onChangeText={setRepertoire}
              />

              <AccordionBox
                title="Staff, Classes & Rehearsals"
                description="Describe the teachers and classes, whether they’re mandatory and how dancers are treated. Include your impressions of the artistic staff and how efficient, balanced, and organized rehearsals are."
                placeholder="Describe staff, classes and rehearsal organization"
                iconName="school-outline"
                toolboxInfo="Describe the types of classes offered by the company, what technique is taught, and whether the classes are mandatory. Comment on how the classes are conducted and how dancers are treated. Mention how the artistic staff work (artistic director, ballet masters, répétiteurs, etc.). Explain how rehearsals are organized: whether they are efficient, well planned, and whether time is fairly distributed among different productions. You can add any other relevant details."
                value={staff}
                onChangeText={setStaff}
              />

              <AccordionBox
                title="Schedule & Holidays"
                description="Mention how many days and hours you usually work, if extra hours are common and paid, and how much notice you get for schedules and holidays."
                placeholder="Describe schedule, workload and holidays"
                iconName="calendar-outline"
                toolboxInfo="Describe your typical weekly schedule (rehearsals, shows, classes, etc.). Mention what counts as extra hours, if they’re paid, and how. Say how far in advance you receive the schedule and if it changes often. Include how many vacation days you get and how early they’re announced. Add any other relevant info."
                value={schedule}
                onChangeText={setSchedule}
              />

              <AccordionBox
                title="Facilities, Wellbeing & Injuries"
                description="Describe the facilities and if you have access to physio, medical staff, or a trainer. Mention the support received in case of injury and whether it affects your salary or contract."
                placeholder="Describe facilities, physio access and injury support"
                iconName="medkit-outline"
                toolboxInfo="Briefly describe the working facilities: studio quality, theatre, dressing rooms, gym, etc. Say if there’s access to physiotherapy and how often. Mention other professionals (doctor, nutritionist, trainer) and whether they’re regularly available. Explain what happens if you get injured—support provided, paid leave, financial compensation, and contract security. Add anything else you find relevant."
                value={facilities}
                onChangeText={setFacilities}
              />

              <AccordionBox
                title="Colleagues & General Mood"
                description="Describe the general level of the dancers and the atmosphere among colleagues."
                placeholder="Describe atmosphere and team dynamic"
                iconName="people-outline"
                toolboxInfo="Comment on the technical and artistic level of the dancers in the company. Describe the work atmosphere—collaborative, competitive, friendly, tense, etc. Add anything that helps reflect the group dynamic day to day."
                value={colleagues}
                onChangeText={setColleagues}
              />

              <AccordionBox
                title="City, Transport & Living"
                description="Share your thoughts on living in the city: whether it's easy to get around, find housing, and what the social life is like."
                placeholder="Describe the city and quality of life"
                iconName="home-outline"
                toolboxInfo="Describe the city where the company is based. Is it easy to find housing and get around? What is the general atmosphere like? Comment on whether there is an active social scene, cultural options, nature, or activities for free time. Mention if the local language affects your ability to integrate outside of work. Add anything else that helps imagine what living there is like."
                value={city}
                onChangeText={setCity}
              />

              <View style={styles.visibilityAndRatingRow}>
                <VisibilityTags value={visibility} onChange={setVisibility} />

                <View style={styles.ratingBox}>
                  <Text style={styles.ratingLabel}>Overall rating 1-5</Text>
                  <StarRating
                    rating={rating}
                    onChange={setRating}
                    starSize={24}
                    color="#f5a623"
                    enableHalfStar
                  />
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.postButton} onPress={attemptSubmit}>
                  <View style={styles.postButtonContent}>
                    <Text style={styles.postButtonText}>{submitLabel ?? (mode === ReviewModesEnum.EDIT ? 'Save' : 'Post')}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                  </View>
                </Pressable>
              </View>

            </Animated.ScrollView>
          </View>
        </Animated.View>
      </Modal>

      <ConfirmSubmitModal
        visible={confirmModalVisible}
        missingFields={missingFields}
        onCancel={() => setConfirmModalVisible(false)}
        onConfirm={confirmSubmit}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 5,
    maxWidth: 800,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8, // espacio entre el botón y el texto
  },

  closeButton: {
    padding: 4,
  },

  title: {
    fontSize: 18, // más pequeño que antes
    fontWeight: '600',
    color: '#222',
  },

  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },

  disclaimerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },

  visibilityAndRatingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 16,
  },

  ratingBox: {
    alignItems: 'flex-start',
  },

  ratingLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    marginLeft: 2,
  },

  scrollContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },

  scrollView: {
    paddingBottom: 16,
    paddingRight: 4, // para no cortar texto
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },

  postButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#000',
  },

  postButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
