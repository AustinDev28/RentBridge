import { useCallback, useEffect, useState } from "react";
import PostCard from "./PostCard.jsx";
import { getPosts } from "../feedService.js";
import "../feed.css";

const filters = [["all","All"],["buy","Buy"],["rent","Rent"],["following","Following"]];
export default function FeedList() {
  const [filter,setFilter]=useState("all"), [posts,setPosts]=useState([]), [loading,setLoading]=useState(true), [limit,setLimit]=useState(6);
  const load = useCallback(async () => { setLoading(true); const values=await getPosts(filter); setPosts(values); setLimit(6); setLoading(false); },[filter]);
  useEffect(()=>{ load(); const listener=()=>load(); const timer=window.setInterval(load,60000); window.addEventListener("rentbridge-feed-updated",listener); return ()=>{window.clearInterval(timer);window.removeEventListener("rentbridge-feed-updated",listener);}; },[load]);
  return <section className="rb-feed-section" aria-label="Recent property posts">
    <div className="rb-feed-title"><div><p className="rb-eyebrow">From local agents</p><h2>Property updates</h2><p>Fresh homes shared by agents. Each post is available for 24 hours.</p></div></div>
    <div className="rb-filter-chips" role="group" aria-label="Filter posts">{filters.map(([key,label])=><button key={key} type="button" className={filter===key?"is-active":""} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</button>)}</div>
    {loading ? <div className="rb-post-grid" aria-label="Loading posts">{[0,1,2].map((n)=><div className="rb-skeleton" key={n}/>)}</div> : posts.length===0 ? <p className="rb-empty">No active posts right now</p> : <>
      <div className="rb-post-grid">{posts.slice(0,limit).map(post=><PostCard key={post.id} post={post}/>)}</div>
      {limit<posts.length&&<button className="rb-load-more" type="button" onClick={()=>setLimit(limit+6)}>Load more</button>}
    </>}
  </section>;
}
