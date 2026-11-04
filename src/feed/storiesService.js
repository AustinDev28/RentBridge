// Stories and the social feed share the same post collection and expiry rules.
import { getPosts } from "./feedService.js";
export async function getStories() { return (await getPosts("all")).filter((post) => post.alsoInStories !== false); }
