import { Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as FS from 'expo-file-system/legacy';

const EXT_MIME = {
  pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', mov: 'video/quicktime',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
};

function inferMime(uri) {
  try {
    const qless = uri.split('?')[0] || uri;
    const ext = (qless.split('.').pop() || '').toLowerCase();
    return EXT_MIME[ext] || '*/*';
  } catch { return '*/*'; }
}

export async function openFileInDefaultApp({ uri, mimeType }) {
  if (!uri) throw new Error('openFileInDefaultApp: uri required');

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const can = await Linking.canOpenURL(uri);
    if (!can) throw new Error('No app can open this link.');
    await Linking.openURL(uri);
    return;
  }

  if (Platform.OS === 'android') {
    let androidUri = uri;
    if (androidUri.startsWith('file://')) {
      try { androidUri = await FS.getContentUriAsync(androidUri); } catch {}
    }
    const type = mimeType || inferMime(uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: androidUri,
      type,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });
    return;
  }

  if (Platform.OS === 'ios') {
    const can = await Linking.canOpenURL(uri);
    if (!can) throw new Error('iOS cannot open this file type directly in managed Expo.');
    await Linking.openURL(uri);
    return;
  }

  throw new Error('Unsupported platform');
}
