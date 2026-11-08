import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Heart, MoreHorizontal, Share2, ShieldCheck, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ExpiryBadge from "./ExpiryBadge.jsx";
import { getAgent, getFeedState, likePost, reportPost, savePost, followAgent, incrementView, incrementCtaTap } from "../feedService.js";
import { requireSignup } from "../../user/requireSignup.js";
import { requireSignIn } from "../../user/requireSignIn.js";

export default function PostCard({ post, countView = true }) {
  const navigate = useNavigate();
  const cardRef=useRef(null), viewRecorded=useRef(false);
  const agent = getAgent(post.agentId);
  const [state, setState] = useState(getFeedState);
  const [reported, setReported] = useState(false);
  const liked = state.likes.includes(post.id), saved = state.saves.includes(post.id);
  const toggleLike = async () => { await likePost(post.id); setState(getFeedState()); };
  const toggleSave = async () => { await savePost(post.id); setState(getFeedState()); };
  const toggleFollow = async (event) => { if (!requireSignIn(navigate, event)) return; await followAgent(post.agentId); setState(getFeedState()); };
  const share = async () => {
    const url = `${window.location.origin}/?post=${encodeURIComponent(post.id)}#post-${encodeURIComponent(post.id)}`;
    try { await navigator.clipboard.writeText(url); window.alert("Post link copied."); }
    catch { window.prompt("Copy this post link", url); }
  };
  const doReport = async (event) => {
    const reason = event.target.value;
    if (!reason) return;
    await reportPost(post.id, reason); setReported(true);
  };
  const openProperty = (event) => {
    if (!requireSignup(navigate, event)) return;
    incrementCtaTap(post.id);
  };
  useEffect(()=>{
    if(!countView||!cardRef.current||viewRecorded.current)return;
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting&&!viewRecorded.current){viewRecorded.current=true;incrementView(post.id);observer.disconnect();}},{threshold:.5});
    observer.observe(cardRef.current);return()=>observer.disconnect();
  },[countView,post.id]);
  return <article className="rb-post-card" ref={cardRef} id={`post-${post.id}`}>
    <header className="rb-post-head">
      <span className="rb-avatar">{agent?.avatar ? <img src={agent.avatar} alt="" /> : agent?.name?.slice(0,1)}</span>
      <span className="rb-agent-copy"><strong>{agent?.name || "RentBridge Agent"}</strong><small>{agent?.agency || "Property agent"}</small></span>
      {agent?.verified && <span className="rb-verified" title="Verified agent"><ShieldCheck size={15}/> Verified</span>}
      <button className="rb-follow-button" type="button" onClick={toggleFollow} aria-pressed={state.follows.includes(post.agentId)}>{state.follows.includes(post.agentId) ? "Following" : "Follow"}</button>
      <ExpiryBadge post={post}/>
    </header>
    <div className="rb-post-image-wrap">
      <img className="rb-post-image" src={post.imageUrl} alt={`Property in ${post.location}`} loading="lazy"/>
      <span className={`rb-type rb-type-${post.type}`}>{post.type === "buy" ? "Buy" : "Rent"}</span>
    </div>
    <div className="rb-post-body">
      <p className="rb-caption">{post.caption}</p>
      <p className="rb-post-price">₦{Number(post.price).toLocaleString("en-NG")} <span>{post.type === "rent" ? "/ year" : ""}</span></p>
      <p className="rb-post-location">{post.location}</p>
      <div className="rb-post-actions" aria-label="Post actions">
        <button type="button" onClick={toggleLike} aria-label={liked ? "Unlike post" : "Like post"} aria-pressed={liked}><Heart size={18} fill={liked ? "currentColor" : "none"}/><span>{post.likeCount}</span></button>
        <button type="button" onClick={toggleSave} aria-label={saved ? "Unsave post" : "Save post"} aria-pressed={saved}><Bookmark size={18} fill={saved ? "currentColor" : "none"}/></button>
        <button type="button" onClick={share} aria-label="Share post"><Share2 size={18}/></button>
        <span className="rb-view-count"><Eye size={15}/>{post.viewCount}</span>
      </div>
      <div className="rb-post-footer">
        <Link to="/properties" className="rb-property-cta" onClick={openProperty}>View property</Link>
        <label className="rb-report-label">{reported ? <><Check size={15}/> Reported</> : <><MoreHorizontal size={16}/><span className="sr-only">Report post</span><select value="" onChange={doReport} aria-label="Report post"><option value="">Report</option>{["Misleading information", "Spam", "Inappropriate content", "Other"].map((reason)=><option key={reason}>{reason}</option>)}</select></>}</label>
      </div>
    </div>
  </article>;
}
