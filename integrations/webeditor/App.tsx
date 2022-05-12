import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import ReactDOM from 'react-dom';
import {Editor, EditorState} from 'draft-js';
import 'draft-js/dist/Draft.css';
import React from 'react';

export default function App() {
  return (
    <TextEditor />
  );
}

const colorScheme = Appearance.getColorScheme()
const styles = StyleSheet.create({
  container: {
    flex: 1,
    color:'black',
    colorScheme:'dark',
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
