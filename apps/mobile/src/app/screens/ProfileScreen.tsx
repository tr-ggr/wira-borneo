import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ScreenLayout } from '../components/ScreenLayout';
import { useDisasterApi } from '../hooks/useDisasterApi';
import { useAppState } from '../state/AppState';

export const ProfileScreen = () => {
  const { profile, setLoggedIn, setVolunteer, setFamilyCode, setDisplayName } = useAppState();
  const { mutations } = useDisasterApi();

  const [displayName, updateDisplayName] = useState(profile.displayName);
  const [familyCodeInput, setFamilyCodeInput] = useState(profile.familyCode);

  const onLogin = async () => {
    await mutations.signIn.mutateAsync().catch(() => undefined);
    await mutations.createFamily.mutateAsync({ data: { note: 'bootstrap profile' } }).catch(() => undefined);
    await mutations.joinFamily.mutateAsync({ data: { code: familyCodeInput } }).catch(() => undefined);
    setLoggedIn(true);
  };

  const onRegister = async () => {
    await mutations.signUp.mutateAsync().catch(() => undefined);
    setDisplayName(displayName.trim() || 'Local Resident');
    setFamilyCode(familyCodeInput.trim() || profile.familyCode);
    setLoggedIn(true);
  };

  const onApplyVolunteer = async () => {
    await mutations.applyVolunteer
      .mutateAsync({
        data: {
          motivation: 'Ready for rescue logistics and first-aid coordination.',
        },
      })
      .catch(() => undefined);
    setVolunteer(true);
  };

  return (
    <ScreenLayout
      title="Profile"
      subtitle="Manage login, permanent family party code, and volunteer registration status."
    >
      <Card title="Identity" subtitle="Login/Register flow">
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={updateDisplayName}
          placeholder="Display name"
          placeholderTextColor="#63809D"
        />
        <View style={styles.buttonRow}>
          <Pressable style={styles.button} onPress={onLogin}>
            <Text style={styles.buttonLabel}>Login</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={onRegister}>
            <Text style={styles.buttonSecondaryLabel}>Register</Text>
          </Pressable>
        </View>
        <Badge label={profile.isLoggedIn ? 'Logged In' : 'Guest'} />
      </Card>

      <Card title="Family Party Code" subtitle="Permanent code for joining your family group">
        <TextInput
          style={styles.input}
          value={familyCodeInput}
          onChangeText={setFamilyCodeInput}
          placeholder="Family code"
          placeholderTextColor="#63809D"
        />
        <Pressable style={styles.button} onPress={() => setFamilyCode(familyCodeInput)}>
          <Text style={styles.buttonLabel}>Save Family Code</Text>
        </Pressable>
      </Card>

      <Card title="Volunteer Status" subtitle="Only volunteers can take assistance tasks">
        <Badge label={profile.isVolunteer ? 'Volunteer Active' : 'Not a Volunteer'} />
        {!profile.isVolunteer ? (
          <Pressable style={styles.button} onPress={onApplyVolunteer}>
            <Text style={styles.buttonLabel}>Register as Volunteer</Text>
          </Pressable>
        ) : null}
      </Card>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#BED0E1',
    borderRadius: 10,
    backgroundColor: '#F7FAFD',
    color: '#0D3B66',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    flex: 1,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonSecondary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0D3B66',
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    flex: 1,
  },
  buttonSecondaryLabel: {
    color: '#0D3B66',
    fontWeight: '700',
    fontSize: 13,
  },
});
