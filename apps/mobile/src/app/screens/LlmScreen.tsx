import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { ScreenLayout } from '../components/ScreenLayout';
import { useDisasterApi } from '../hooks/useDisasterApi';
import { useAppState } from '../state/AppState';

export const LlmScreen = () => {
  const { messages, addMessage } = useAppState();
  const { mutations } = useDisasterApi();

  const [prompt, setPrompt] = useState('What should we prepare if typhoon landfall is in 6 hours?');

  const onAsk = async () => {
    const content = prompt.trim();
    if (!content) {
      return;
    }

    addMessage({
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: 'now',
    });

    setPrompt('');

    try {
      await mutations.askAssistant.mutateAsync({ data: { message: content } });
      addMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: 'Request sent to assistant. Live answer will appear when backend response format is finalized.',
        timestamp: 'now',
      });
    } catch {
      addMessage({
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: 'Offline fallback: prioritize go-bag, power banks, drinking water, and family meetup points.',
        timestamp: 'now',
      });
    }
  };

  return (
    <ScreenLayout
      title="LLM Assistant"
      subtitle="Ask general disaster readiness questions for flood, typhoon, and aftershock situations."
    >
      <Card title="Inquire" subtitle="No direct fetch used; this calls the generated assistant mutation">
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Ask your question"
          placeholderTextColor="#63809D"
        />
        <Pressable style={styles.button} onPress={onAsk}>
          <Text style={styles.buttonLabel}>Ask Assistant</Text>
        </Pressable>
      </Card>

      <Card title="Conversation" subtitle="Latest first">
        {messages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageBubble, message.role === 'assistant' ? styles.assistant : styles.user]}
          >
            <Text style={styles.roleLabel}>{message.role.toUpperCase()}</Text>
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        ))}
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
    minHeight: 90,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 2,
    borderRadius: 10,
    backgroundColor: '#0D3B66',
    paddingVertical: 11,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  messageBubble: {
    borderRadius: 10,
    padding: 10,
  },
  assistant: {
    backgroundColor: '#DFF0FF',
  },
  user: {
    backgroundColor: '#EFF6DD',
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#36516A',
    marginBottom: 3,
  },
  messageText: {
    color: '#0D3B66',
    fontSize: 12,
    lineHeight: 17,
  },
});
