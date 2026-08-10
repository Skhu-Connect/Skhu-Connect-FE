import assert from "node:assert/strict";
import { notificationMessage } from "../src/api/index.js";

assert.equal(notificationMessage({ type: "PETITION_AGREEMENT_60_PERCENT", message: "瀞??????? ?쐆????" }), "내 청원이 목표 공감의 60%에 도달했습니다.");
assert.equal(notificationMessage({ type: "COMMENT_REPLY", message: "내 댓글에 답글이 등록되었습니다." }), "내 댓글에 답글이 등록되었습니다.");
