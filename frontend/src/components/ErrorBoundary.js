import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>⚠️ Có lỗi xảy ra</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.toString() || 'Unknown error'}
            </Text>
            <ScrollView style={styles.stackTrace}>
              <Text style={styles.stackTraceText}>
                {this.state.errorInfo?.componentStack || ''}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.reloadButton}
              onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              <Text style={styles.reloadButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  stackTrace: {
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  stackTraceText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  reloadButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;



