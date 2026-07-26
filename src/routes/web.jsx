/* 학생 웹 라우트. Phase 1 은 이 파일과 src/pages/web/* 만 건드린다
   (Admin 트랙과 같은 워킹트리에서 병렬로 돌기 때문에 App.jsx 를 공유하지 않는다). */

import { Route } from "react-router-dom";
import WebLayout from "../layouts/WebLayout";
import {
  BookmarkScreen,
  DetailScreen,
  FeedScreen,
  LoginScreen,
  SubmitScreen,
} from "../pages/placeholders-web";

export function webRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginScreen />} />
      <Route element={<WebLayout />}>
        <Route path="/" element={<FeedScreen nav="feed" />} />
        <Route path="/answered" element={<FeedScreen nav="answered" />} />
        <Route path="/mine" element={<FeedScreen nav="mine" />} />
        <Route path="/bookmarks" element={<BookmarkScreen />} />
        <Route path="/p/:id" element={<DetailScreen />} />
        <Route path="/submit" element={<SubmitScreen />} />
      </Route>
    </>
  );
}
