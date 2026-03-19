export const reactNativeSection = {
  title: "React Native Basics",
  content: `
# React Native Basics

Understand the fundamentals of React Native in Rulxy.

## What is React Native?

React Native lets you build mobile apps using React:
- **Write once**: Shared logic across iOS/Android
- **Native performance**: Real native components
- **Hot reload**: See changes instantly
- **Large ecosystem**: Thousands of libraries

## Core Concepts

### Components
React Native uses native components:

\`\`\`jsx
// Instead of HTML elements
<View>      // Like <div>
<Text>      // Like <p> or <span>
<Image>     // Like <img>
<ScrollView> // Scrollable container
<TouchableOpacity> // Pressable element
\`\`\`

### Styling
Styles use JavaScript objects:

\`\`\`jsx
const styles = {
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  }
}
\`\`\`

### Navigation
Expo Router handles navigation:

\`\`\`
app/
  (tabs)/
    index.tsx    # Home tab
    search.tsx   # Search tab
    profile.tsx  # Profile tab
  _layout.tsx    # Navigation config
\`\`\`

## Rulxy + React Native

When you describe features, Rulxy generates proper React Native code:

### Your Prompt
\`\`\`
"Create a profile screen with avatar, name, and settings list"
\`\`\`

### Generated Code
\`\`\`jsx
export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
      </View>
      <SettingsList items={settings} />
    </ScrollView>
  );
}
\`\`\`

## Best Practices

1. **Use Flexbox**: Primary layout system
2. **Platform-specific**: Use Platform.OS when needed
3. **Performance**: Optimize lists with FlatList
4. **Testing**: Always test on real devices
    `,
};
