import * as React from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import Constants from 'expo-constants';


// You can import from local files
import AssetExample from './components/AssetExample';

// or any pure javascript modules available in npm
import { Card } from 'react-native-paper';

export default function App() {
  return (
    <View style={styles.container}>
       
      <Text style={styles.paragraph}>
       Welcome To Teledrive!
      </Text>
      <Card>
        <AssetExample />
      </Card>
       <Button
        title="Login"
        
        color="#088dcd"
        onPress={() => Alert.alert('Please enter your Teledrive Server URL')}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: 'black',
    padding: 8,
  },
  paragraph: {
    color: 'white',
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
