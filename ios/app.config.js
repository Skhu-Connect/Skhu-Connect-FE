/* app.json 을 그대로 두고 한 항목만 환경변수로 덮어쓴다.
   GoogleService-Info.plist 는 Firebase 키가 들어 있어 .gitignore 에 있고, EAS Build 는
   git 이 추적하는 파일만 올린다 — 그래서 빌드 머신에는 파일이 없다. EAS 파일 환경변수
   GOOGLE_SERVICES_INFO_PLIST 가 빌드 때 파일을 내려받아 그 경로를 넘겨준다.
   환경변수가 없으면(로컬) app.json 의 기존 경로를 그대로 쓴다. */
export default ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    googleServicesFile: process.env.GOOGLE_SERVICES_INFO_PLIST ?? config.ios.googleServicesFile,
  },
});
