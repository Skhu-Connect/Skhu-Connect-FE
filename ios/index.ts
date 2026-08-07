import { registerRootComponent } from 'expo';

import { registerBackgroundHandler } from './src/push';
import App from './App';

// AppRegistry 등록보다 먼저 — 앱이 백그라운드/종료 상태일 때 온 FCM 메시지를 처리한다.
registerBackgroundHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
