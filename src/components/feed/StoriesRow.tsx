import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import StoryAvatar from './StoryAvatar';

export interface StoryFriend {
  id: string;
  name: string;
  initials: string;
  hasStory: boolean;
  isTraining: boolean;
}

interface Props {
  friends: StoryFriend[];
  onAddStory: () => void;
  onViewStory: (userId: string) => void;
}

export default function StoriesRow({ friends, onAddStory, onViewStory }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <StoryAvatar
        name="Você"
        initials="+"
        hasStory={false}
        isTraining={false}
        isAddStory
        onPress={onAddStory}
      />
      {friends.map((friend) => (
        <StoryAvatar
          key={friend.id}
          name={friend.name}
          initials={friend.initials}
          hasStory={friend.hasStory}
          isTraining={friend.isTraining}
          onPress={() => onViewStory(friend.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 20,
  },
  container: {
    gap: 14,
    paddingHorizontal: 20,
  },
});
