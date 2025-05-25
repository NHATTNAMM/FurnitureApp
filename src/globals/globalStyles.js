import React from 'react'
import { StyleSheet } from 'react-native'
import style from './style';
const globalStyles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#000D66',
        flex: 1,
      },
      topNav: {
        backgroundColor: '#000D66',
        height: 50,
        marginLeft:10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
      },
      navTitle:{
        fontSize:23,
        fontWeight:'bold',
        color:'white',
        textAlign:'center',
        textShadowColor: 'red',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        marginTop:10,
      },
      hr80:{
        width:'80%',
        borderBottomColor: '#FFCBA4',
        borderBottomWidth:1,
        marginVertical:10, 
        
      },
        title: {
          fontSize: 26,
          fontWeight: 'bold',
          color:style.colors.title ,
          marginBottom: 20,
          textShadowColor: 'black',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
          alignContent:'center',
          justifyContent:'center',
          marginTop:20,
        },
        container: {
            flex: 1,
            backgroundColor:style.colors.backgroundColor,
            paddingHorizontal: 20,
            justifyContent: 'center',
            
          },
          hr100:{
            marginTop:5,
            borderBottomColor: '#fff',
            borderBottomWidth:10,
            
            
          },

});

export default globalStyles