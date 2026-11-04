export function stripLegacyPostCommentCounts(posts) {
  return posts.map(({ commentCount: _legacyCount, ...post }) => post);
}

export function stripLegacyFeedComments(feedState) {
  const { comments: _legacyComments, ...state } = feedState;
  return state;
}
