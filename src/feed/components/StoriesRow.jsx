import { useEffect, useState } from "react";
import { getStories } from "../storiesService.js";
import { getAgent } from "../feedService.js";
import { isExpired } from "../utils/expiry.js";

export function StoriesRow() {
  const [stories,setStories]=useState([]), [selected,setSelected]=useState(null);
  useEffect(()=>{let live=true;const load=async()=>{const list=await getStories();if(live){const latestByAgent=new Map();list.filter((post)=>!isExpired(post)).forEach((post)=>{if(!latestByAgent.has(post.agentId))latestByAgent.set(post.agentId,post);});setStories([...latestByAgent.values()]);}};load();const timer=window.setInterval(load,60000);const listener=load;window.addEventListener("rentbridge-feed-updated",listener);return()=>{live=false;window.clearInterval(timer);window.removeEventListener("rentbridge-feed-updated",listener);};},[]);
  return <section className="rb-stories" aria-label="Agent stories"><div className="rb-stories-heading"><h2>Stories</h2><span>24 hours</span></div><div className="rb-stories-row">{stories.map((post)=>{const agent=getAgent(post.agentId);return <button className="rb-story" type="button" key={post.id} onClick={()=>setSelected(post)} aria-label={`View ${agent?.name}'s property story`}><span className="rb-story-ring"><img src={post.imageUrl} alt=""/></span><span>{agent?.name?.split(" ")[0]}</span></button>;})}</div>
    {selected&&!isExpired(selected)&&<div className="rb-story-modal" role="dialog" aria-modal="true" aria-label="Property story" onClick={()=>setSelected(null)}><article onClick={(event)=>event.stopPropagation()}><button type="button" aria-label="Close story" onClick={()=>setSelected(null)}>×</button><img src={selected.imageUrl} alt={`Property in ${selected.location}`}/><div><strong>{getAgent(selected.agentId)?.name}</strong><p>{selected.caption}</p><b>{selected.location}</b><p>₦{Number(selected.price).toLocaleString("en-NG")}</p></div></article></div>}
  </section>;
}
