/* RNFirebase(26.x)는 기본으로 Firebase SDK를 SPM(Swift Package Manager)으로 받는다 — 이 조합이
   Xcode 26 시뮬레이터에서 SwiftUICore 링커 에러("not an allowed client of it")를 낸다
   (invertase/react-native-firebase#8702, 같은 증상). CocoaPods 경로로 되돌리려면 Podfile에
   `$RNFirebaseDisableSPM = true` 를 어떤 target 블록보다도 먼저 Ruby 전역변수로 둬야 하는데,
   이건 Podfile 텍스트 자체를 건드려야 하는 설정이라 @react-native-firebase/app 의 Expo
   config plugin 에는 대응 옵션이 없다(node_modules 소스로 직접 확인함). CNG 로 매번
   재생성되는 Podfile 에 매번 이 줄을 꽂아 넣는 게 이 플러그인의 유일한 역할이다. */
const { withPodfile } = require("expo/config-plugins");

const FLAG = "$RNFirebaseDisableSPM = true";

module.exports = function withRNFirebaseDisableSpm(config) {
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes(FLAG)) {
      config.modResults.contents = `${FLAG}\n${config.modResults.contents}`;
    }
    return config;
  });
};
