import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { ScreenLayout } from '../components/ScreenLayout';
import { useDisasterApi } from '../hooks/useDisasterApi';
import { useAppState } from '../state/AppState';

export const HelpScreen = () => {
  const { profile } = useAppState();
  const { queries, mutations } = useDisasterApi();

  const [title, setTitle] = useState('Need evacuation pickup');
  const [details, setDetails] = useState('Family with one child near river street.');

  const onRequestHelp = async () => {
    await mutations.createHelpRequest
      .mutateAsync({
        data: {
          title,
          details,
          priority: 'high',
        },
      })
      .catch(() => undefined);
  };

  const onVolunteerTakeAction = async () => {
    if (!profile.isVolunteer) {
      return;
    }

    await mutations.claimHelpRequest.mutateAsync({ id: 'latest' }).catch(() => undefined);
    await mutations.updateHelpStatus
      .mutateAsync({ id: 'latest', data: { status: 'in-progress' } })
      .catch(() => undefined);
  };

  return (
    <ScreenLayout
      title="Help"
      subtitle="Residents can request support. Volunteer-only actions are enforced in the UI flow."
    >
      <Card title="Request Help" subtitle="Submit your emergency assistance request">
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Help request title"
          placeholderTextColor="#63809D"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          value={details}
          onChangeText={setDetails}
          multiline
          placeholder="Details"
          placeholderTextColor="#63809D"
        />
        <Pressable style={styles.button} onPress={onRequestHelp}>
          <Text style={styles.buttonLabel}>Request Help</Text>
        </Pressable>
      </Card>

      <Card title="Volunteer Console" subtitle="Only volunteers can claim and process requests">
        <Badge label={profile.isVolunteer ? 'Volunteer Access' : 'Access Locked'} />
        <Pressable
          style={[styles.button, !profile.isVolunteer ? styles.buttonDisabled : null]}
          onPress={onVolunteerTakeAction}
          disabled={!profile.isVolunteer}
        >
          <Text style={styles.buttonLabel}>Claim & Start Latest Request</Text>
        </Pressable>
      </Card>

      <Card title="My Requests" subtitle="This panel tracks your outgoing request lifecycle">
        <Text style={styles.helperText}>
          {queries.myHelpRequests.isFetching
            ? 'Refreshing your request status...'
            : 'No active request payload returned yet. Hook is connected and polling.'}
        </Text>
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    borderRadius: 10,
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#8FA4BA',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  helperText: {
    color: '#36516A',
    fontSize: 12,
  },
});
