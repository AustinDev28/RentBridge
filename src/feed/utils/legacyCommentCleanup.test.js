import assert from "node:assert/strict";
import test from "node:test";
import { stripLegacyFeedComments, stripLegacyPostCommentCounts } from "./legacyCommentCleanup.js";

test("removes legacy comment counts while preserving other post fields", () => {
  const post = { id: "post-1", likeCount: 4, commentCount: 2, status: "active" };
  const [cleanPost] = stripLegacyPostCommentCounts([post]);

  assert.deepEqual(cleanPost, { id: "post-1", likeCount: 4, status: "active" });
  assert.equal(Object.hasOwn(cleanPost, "commentCount"), false);
  assert.equal(post.commentCount, 2, "cleanup does not mutate the input object");
});

test("removes legacy comments but preserves other saved feed interactions", () => {
  const feedState = {
    likes: ["post-1"],
    saves: ["post-2"],
    follows: ["agent-1"],
    reports: [{ postId: "post-3", reason: "Spam" }],
    comments: { "post-1": [{ id: "comment-1", text: "legacy" }] },
  };
  const cleanState = stripLegacyFeedComments(feedState);

  assert.deepEqual(cleanState, {
    likes: ["post-1"],
    saves: ["post-2"],
    follows: ["agent-1"],
    reports: [{ postId: "post-3", reason: "Spam" }],
  });
  assert.equal(Object.hasOwn(cleanState, "comments"), false);
});
