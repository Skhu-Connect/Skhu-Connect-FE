/* FCM 푸시 — 권한 요청, 토큰 등록/해제, 포그라운드·탭 이벤트.
   rnfirebase.io 모듈러 API(v26) 기준. iOS 는 expo-notifications 의 getDevicePushTokenAsync() 가
   raw APNs 토큰만 주기 때문에 못 쓴다 — 백엔드가 원하는 진짜 FCM 토큰은 APNs↔FCM 교환을
   자동 처리하는 @react-native-firebase/messaging 이 있어야 나온다.

   네이티브 리빌드(GoogleService-Info.plist + expo-build-properties useFrameworks dynamic) 전에는
   이 파일을 어디서도 import 하지 않는다 — 아직 없는 네이티브 모듈을 불러오면 앱이 즉시 깨진다. */
import { Linking } from "react-native";
import {
  AuthorizationStatus,
  getInitialNotification,
  hasPermission,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from "@react-native-firebase/messaging";
import { deleteFcmToken, registerFcmToken } from "./api";

let unsubTokenRefresh: (() => void) | null = null;

/** 기기 단위 알림 on/off 는 iOS 알림 권한이 갖는다 — 서버엔 저장할 스위치가 없다(NotifSettings.tsx). */
export type PushStatus = "granted" | "denied" | "undetermined";

export async function pushPermissionStatus(): Promise<PushStatus> {
  try {
    const status = await hasPermission(getMessaging());
    if (status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL) return "granted";
    if (status === AuthorizationStatus.NOT_DETERMINED) return "undetermined";
    return "denied";
  } catch {
    return "denied";
  }
}

/** 한 번 거부하면 iOS 는 앱 안에서 다시 물을 수 없다 — 그때는 설정 앱으로 보낸다. */
export function openSystemNotificationSettings(): void {
  Linking.openSettings().catch(() => {});
}

/** 로그인 성공 뒤 호출한다. 거부되면 조용히 넘어간다 — 알림은 부가 기능이지 필수 흐름이 아니다. */
export async function registerForPush(): Promise<void> {
  try {
    const messaging = getMessaging();
    const status = await requestPermission(messaging);
    const granted = status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
    if (!granted) return;

    await registerDeviceForRemoteMessages(messaging); // v18+ 는 getToken() 전에 이걸 명시적으로 불러야 한다 — 안 그러면 messaging/unregistered
    const token = await getToken(messaging);
    await registerFcmToken(token);
    unsubTokenRefresh?.();
    unsubTokenRefresh = onTokenRefresh(messaging, (t) => {
      registerFcmToken(t).catch((e) => console.warn("[push] FCM token refresh registration failed", e));
    });
  } catch (e) {
    console.warn("[push] FCM token registration failed", e);
  }
}

/** 로그아웃 시 호출한다. best-effort — 실패해도 로컬 세션 정리를 막지 않는다. */
export async function unregisterFromPush(): Promise<void> {
  unsubTokenRefresh?.();
  unsubTokenRefresh = null;
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    await deleteFcmToken(token);
  } catch (e) {
    console.warn("[push] FCM token unregistration failed", e);
  }
}

/** 앱이 열려 있는 동안 푸시가 오면 호출된다(시스템 배너 없음) — App.tsx 가 토스트 + 알림
    재조회로 반응한다. */
export function onForegroundMessage(cb: (message: RemoteMessage) => void): () => void {
  return onMessage(getMessaging(), cb);
}

/** remoteMessage.data.petitionId 는 백엔드 실제 FCM payload 구조를 아직 몰라 추정이다.
    없거나 숫자로 안 읽히면 null — 호출부가 상세 대신 MY(알림함)로 안전하게 폴백한다. */
function petitionIdFrom(message: RemoteMessage | null): number | null {
  const raw = message?.data?.petitionId;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** 앱이 백그라운드 상태에서 알림을 탭해 포그라운드로 온 경우. */
export function onNotificationTapped(cb: (petitionId: number | null) => void): () => void {
  return onNotificationOpenedApp(getMessaging(), (message) => cb(petitionIdFrom(message)));
}

/** 앱이 완전히 종료된 상태에서 알림을 탭해 콜드 스타트로 열린 경우. 부팅 시 한 번 확인한다. */
export async function getTappedNotificationPetitionId(): Promise<number | null> {
  const message = await getInitialNotification(getMessaging());
  return petitionIdFrom(message);
}

/** index.ts 가 AppRegistry 등록보다 먼저 한 번 호출한다. */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(), async () => {});
}
