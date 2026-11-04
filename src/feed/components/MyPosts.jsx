import { useEffect, useState } from "react";
import { Eye, Heart, Trash2, RotateCw } from "lucide-react";
import { getCurrentAgent } from "../../agent/authService.js";
import { deletePost, getAgentPosts, createPost } from "../feedService.js";
import { isExpired, timeLeft } from "../utils/expiry.js";

export default function MyPosts(){
  const agent=getCurrentAgent(),[posts,setPosts]=useState([]),[tab,setTab]=useState("active"),[notice,setNotice]=useState("");
  const load=async()=>setPosts(await getAgentPosts(agent.id));
  useEffect(()=>{load();const listener=load;window.addEventListener("rentbridge-feed-updated",listener);return()=>window.removeEventListener("rentbridge-feed-updated",listener);},[]);
  const active=posts.filter((post)=>post.status==="active"&&!isExpired(post));
  const past=posts.filter((post)=>post.status==="expired"||isExpired(post));
  const repost=async(post)=>{const {agentId,listingId,type,imageUrl,caption,price,location,alsoInStories}=post;const result=await createPost({agentId,listingId,type,imageUrl,caption,price,location,alsoInStories});if(result.error) setNotice("You have reached the limit of 5 posts in 24 hours.");else {setNotice("Post shared again.");load();}};
  const remove=async(id)=>{await deletePost(id);await load();};
  return <section className="rb-agent-panel"><div className="rb-tabs" role="tablist" aria-label="Your posts"><button role="tab" aria-selected={tab==="active"} className={tab==="active"?"is-active":""} onClick={()=>setTab("active")}>Active ({active.length})</button><button role="tab" aria-selected={tab==="past"} className={tab==="past"?"is-active":""} onClick={()=>setTab("past")}>Past ({past.length})</button></div>{notice&&<p role="status" className="rb-form-success">{notice}</p>}{(tab==="active"?active:past).length===0?<p className="rb-empty">{tab==="active"?"No active posts yet. Create your first post above.":"Expired posts will appear here with their final stats."}</p>:<div className="rb-my-posts">{(tab==="active"?active:past).map((post)=>{const remaining=timeLeft(post);return <article className="rb-my-post" key={post.id}><img src={post.imageUrl} alt=""/><div className="rb-my-post-copy"><strong>{post.location}</strong><p>{post.caption}</p>{tab==="active"?<small>Expires in {remaining.hours}h {remaining.minutes}m</small>:<small>Expired · {new Date(post.expiresAt).toLocaleDateString()}</small>}<div className="rb-stats"><span><Eye size={15}/>{post.viewCount}</span><span><Heart size={15}/>{post.likeCount}</span><span>CTA {post.ctaTapCount||0}</span></div></div><div className="rb-my-actions">{tab==="active"?<button type="button" onClick={()=>remove(post.id)} aria-label="Delete post"><Trash2 size={17}/> Delete</button>:<button type="button" onClick={()=>repost(post)}><RotateCw size={16}/> Repost</button>}</div></article>;})}</div>}</section>;
}
