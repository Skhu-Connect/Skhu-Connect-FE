import assert from "node:assert/strict";
import { notificationMessage } from "../src/api/index.js";
import { NOTIF_POINTS, NOTIF_TYPE_TITLE, pointOf } from "../src/components/web/notifMeta.js";

assert.equal(notificationMessage({ type: "PETITION_AGREEMENT_60_PERCENT", message: "瀞??????? ?쐆????" }), "내 청원이 목표 요청의 60%에 도달했습니다.");
assert.equal(notificationMessage({ type: "COMMENT_REPLY", message: "내 댓글에 답글이 등록되었습니다." }), "내 댓글에 답글이 등록되었습니다.");

/* 알림 포인트 5개가 서버 NotificationType 8종을 빠짐없이·겹치지 않게 덮는지.
   iOS 쪽 같은 표(ios/src/data.ts NOTIF_POINTS)와 짝이며 검사도 ios/src/selfcheck.ts 와 같다 —
   백엔드가 enum 을 늘리면 양쪽 다 여기서 먼저 터진다. */
const SERVER_NOTIF_TYPES = [
  "PETITION_AGREEMENT_60_PERCENT",
  "PETITION_AGREEMENT_100_PERCENT",
  "PETITION_UNDER_REVIEW",
  "PETITION_ANSWERED",
  "COMMENT_REPLY",
  "COMMENT_LIKE",
  "REPLY_LIKE",
  "NOTICE",
];
const mapped = NOTIF_POINTS.flatMap((point) => point.types);
assert.equal(NOTIF_POINTS.length, 5, "알림 포인트는 백엔드 NotificationEventService 의 발생 지점 5곳");
assert.equal(new Set(mapped).size, mapped.length, "한 알림 종류가 두 포인트에 걸치면 안 된다");
assert.deepEqual([...mapped].sort(), [...SERVER_NOTIF_TYPES].sort(), "8종이 5개 포인트로 빠짐없이 나뉘어야 한다");
assert.deepEqual(Object.keys(NOTIF_TYPE_TITLE).sort(), [...SERVER_NOTIF_TYPES].sort(), "제목도 8종 전부 있어야 한다");
assert.equal(pointOf("PETITION_ANSWERED").key, "answer");
assert.equal(pointOf("WHAT_IS_THIS").key, "etc", "모르는 종류는 회색 기본값으로 떨어진다");

console.log("notification checks ok");
