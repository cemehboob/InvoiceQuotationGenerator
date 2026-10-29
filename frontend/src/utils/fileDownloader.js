/**
 * Cross-platform PDF download and share utility for Web, Android, and iOS
 */
import { isNativePlatform } from './platform';

export const downloadOrSharePdf = async (blobData, defaultFileName) => {
  try {
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData], { type: 'application/pdf' });

    // 1. Mobile Native platform (Capacitor)
    if (isNativePlatform()) {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const dataUrl = await base64Promise;

        // Try using navigator.share if Web Share API is available in mobile webview
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], defaultFileName, { type: 'application/pdf' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: defaultFileName,
              text: `PDF document: ${defaultFileName}`,
            });
            return;
          }
        }

        // Alternative for mobile: open blob in system reader / new window
        const fileUrl = window.URL.createObjectURL(blob);
        window.open(fileUrl, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60000);
        return;
      } catch (nativeErr) {
        console.warn('Native mobile share failed, falling back to browser download:', nativeErr);
      }
    }

    // 2. Standard Web Browser download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.error('Failed to download or share file:', err);
    throw err;
  }
};

