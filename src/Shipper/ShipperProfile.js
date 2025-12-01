import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../Firebase/UserContext';
import { updateProfile } from '../Firebase/FirebaseAPI';

const ShipperProfile = ({ navigation }) => {
  const { user, setUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    // Validate
    if (!formData.fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(user.id, {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });

      if (result.success) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
        setIsEditing(false);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể cập nhật thông tin');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user.fullName || '',
      phone: user.phone || '',
      address: user.address || '',
      email: user.email || '',
    });
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={60} color="#FFF" />
              </View>
            )}
            <View style={styles.shipperBadge}>
              <MaterialIcons name="local-shipping" size={18} color="#FFF" />
            </View>
          </View>
          <Text style={styles.roleBadge}>SHIPPER</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoContainer}>
          {/* Full Name */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="person" size={22} color="#000D66" />
              <Text style={styles.infoLabel}>Họ và tên</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.infoValue}>
                {formData.fullName || 'Chưa cập nhật'}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="email" size={22} color="#000D66" />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoValue}>{formData.email}</Text>
            <Text style={styles.infoNote}>Email không thể thay đổi</Text>
          </View>

          {/* Phone */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="phone" size={22} color="#000D66" />
              <Text style={styles.infoLabel}>Số điện thoại</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>
                {formData.phone || 'Chưa cập nhật'}
              </Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="location" size={22} color="#000D66" />
              <Text style={styles.infoLabel}>Địa chỉ</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Nhập địa chỉ"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.infoValue}>
                {formData.address || 'Chưa cập nhật'}
              </Text>
            )}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statsTitleRow}>
            <Text style={styles.statsTitle}>Thống kê giao hàng</Text>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => navigation.navigate('ShipperHistory')}
            >
              <MaterialIcons name="history" size={20} color="#000D66" />
              <Text style={styles.historyButtonText}>Lịch sử</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{user?.completedOrders || 0}</Text>
              <Text style={styles.statLabel}>Đơn đã giao</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="local-shipping" size={28} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{user?.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Tổng đơn hàng</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!isEditing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <MaterialIcons name="edit" size={22} color="#FFF" />
            <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="check" size={22} color="#FFF" />
                  <Text style={styles.buttonText}>Lưu thay đổi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    height: 60,
    backgroundColor: '#000D66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#000D66',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000D66',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4D79FF',
  },
  shipperBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF9800',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  roleBadge: {
    backgroundColor: '#000D66',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000D66',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  infoNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  statsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000D66',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000D66',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000D66',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  editButton: {
    backgroundColor: '#000D66',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 10,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#000D66',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#000D66',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShipperProfile;
