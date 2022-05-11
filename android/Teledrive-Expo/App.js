import * as React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

export default function App() {
  return (
    <WebView 
      style={styles.container}
      source={{ uri: 'https://teledrive-web.vercel.app/startup'}}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
