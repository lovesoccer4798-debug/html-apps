'use strict';
/* Firebase設定（公開してよい識別子のみ — 秘密鍵ではない。アクセス制御はFirestoreルール側で行う） */
window.TC_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDq8ahZY45RR74Qpd8e3Fh1CYzxDjGAwHA',
  authDomain: 'task-calendar-2312e.firebaseapp.com',
  projectId: 'task-calendar-2312e',
  storageBucket: 'task-calendar-2312e.firebasestorage.app',
  messagingSenderId: '797466638176',
  appId: '1:797466638176:web:3ed98db5247558c815d005',
};

// Googleカレンダー連携（読み込み）用のOAuthクライアントID（Google Cloud Consoleで作成したWebクライアント）。
// 空のままだと設定画面に準備手順が表示される。公開してよい識別子（シークレットではない）。
window.TC_GCAL_CLIENT_ID = '797466638176-2cot9cb3hcpcvj3e8ealm3cps8codnlu.apps.googleusercontent.com';
