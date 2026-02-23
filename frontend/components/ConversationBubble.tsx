import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ConversationBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function ConversationBubble({ role, content }: ConversationBubbleProps) {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: '#7B68EE',
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  text: {
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 22,
  },
});
