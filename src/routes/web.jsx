/* 학생 웹 라우트. Phase 1 은 이 파일과 src/pages/web/* · src/components/web/* 만 건드린다
   (Admin 트랙과 같은 워킹트리에서 병렬로 돌기 때문에 App.jsx 를 공유하지 않는다). */

import { Route } from "react-router-dom";
import WebLayout from "../layouts/WebLayout";
import LoginScreen from "../pages/web/LoginScreen";
import SignupScreen from "../pages/web/SignupScreen";
import FeedScreen from "../pages/web/FeedScreen";
import DetailScreen from "../pages/web/DetailScreen";
import SubmitScreen from "../pages/web/SubmitScreen";
import BookmarkScreen from "../pages/web/BookmarkScreen";
import MyPageScreen from "../pages/web/MyPageScreen";
import SupportScreen from "../pages/web/SupportScreen";
import PrivacyChoicesScreen from "../pages/web/PrivacyChoicesScreen";

export function webRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/support" element={<SupportScreen />} />
      <Route path="/privacy-choices" element={<PrivacyChoicesScreen />} />
      <Route element={<WebLayout />}>
        <Route path="/" element={<FeedScreen nav="feed" />} />
        <Route path="/answered" element={<FeedScreen nav="answered" />} />
        <Route path="/mine" element={<FeedScreen nav="mine" />} />
        <Route path="/bookmarks" element={<BookmarkScreen />} />
        <Route path="/mypage" element={<MyPageScreen />} />
        <Route path="/p/:id" element={<DetailScreen />} />
        <Route path="/submit" element={<SubmitScreen />} />
      </Route>
    </>
  );
}
