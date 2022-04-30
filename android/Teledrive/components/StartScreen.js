import * as React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

export default function AssetExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>
        Connect your Teledrive server here
      </Text>
      <Image style={styles.logo} source={require('../assets/Goldt2eldrivelogo.png')} />
    </View>


  );
}

const styles = StyleSheet.create({
  container: {
   
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    
  },
  paragraph: {
    margin: 24,
    marginTop: 0,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logo: {
    height: 128,
    width: 128,
  
  }

});


