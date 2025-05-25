import { StyleSheet, Text, View,Modal,TouchableOpacity } from 'react-native'
import React from 'react'
import { Feather, MaterialIcons } from '@expo/vector-icons';

const ImageModal = ({visible,onClose,onCamera,onLibrary}) => {
  return (
    <Modal
    visible={visible}
    transparent={true}
     animationType="slide"
    onRequestClose={onClose}    
    >
        <View style={styles.modalView}>
            <View style={styles.container}>
              <Text style={styles.title}>Chọn ảnh</Text>
              <View style={styles.divider}></View>
                <TouchableOpacity style={styles.optionButton} onPress={onCamera}>
                <Feather name="camera" size={24} color="#000d66" />
                <Text style={styles.optionText}>Chụp ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.optionButton} onPress={onLibrary}>
                <MaterialIcons name="photo-library" size={24} color="#000d66" />
                <Text style={styles.optionText}>Chọn từ thư viện</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
  )
}

export default ImageModal

const styles = StyleSheet.create({
  modalView:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container:{
    alignItems: 'center',
    backgroundColor:'white',
    borderRadius:20,
    width:'85%',
    padding:20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000d66',
    marginBottom: 15,
  },
  divider: {
    borderWidth: 1,
    width: '100%',
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  optionButton:{
    flexDirection:'row',
    alignItems:'center',
    padding:15,
    width: '100%',
    borderRadius: 10,
  },
  optionText:{
    marginLeft: 15,
    fontSize: 16,
    color: '#000d66',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelText:{
    color:'#000d66',
    fontSize: 16,
    fontWeight: '500',
  }
})