import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PaymentWebView() {
  const { initPoint, barId, matchId } = useLocalSearchParams();
  const router = useRouter();
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const handleNavigation = (event: any) => {
    const url = event.url;

    if (url.includes('payment/success')) {
      router.replace(`/payment/success?barId=${barId}&matchId=${matchId}`);
    }

    if (url.includes('payment/failure')) {
      router.replace('/payment/failure');
    }

    if (url.includes('payment/pending')) {
      router.replace('/payment/pending');
    }
  };

  if (!initPoint || typeof initPoint !== 'string') return null;

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 1 }}
        />
      )}
      <WebView
        ref={webviewRef}
        source={{ uri: initPoint }}
        onNavigationStateChange={handleNavigation}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState
      />
    </View>
  );
}
