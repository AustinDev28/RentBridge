import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Send } from "lucide-react";
import { getAgentWorkspace, getCurrentAgent } from "../../agent/authService.js";
import { getAgentProfile, createPost } from "../statusService.js";
import { StatusPreview } from "./StatusViewer.jsx";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const temporaryUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(temporaryUrl);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(temporaryUrl);
      reject(new Error("The selected video could not be opened."));
    };
    video.src = temporaryUrl;
  });
}

export default function StatusPostForm() {
  const agent = getCurrentAgent();
  const workspace = useMemo(() => getAgentWorkspace(agent?.id), [agent?.id]);
  const profile = getAgentProfile(agent?.id);
  const [listingId, setListingId] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewTime] = useState(() => new Date().toISOString());
  const formRef = useRef(null);
  const previewUrlRef = useRef("");
  const listings = (workspace.listings || []).filter((listing) => /^(active|available)$/i.test(listing.status || ""));
  const listing = listings.find((item) => item.id === listingId);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const chooseMedia = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const type = IMAGE_TYPES.includes(file.type) ? "image" : VIDEO_TYPES.includes(file.type) ? "video" : "";
    const sizeLimit = type === "video" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (!type) { setError("Choose a JPG, PNG, WebP, MP4, or WebM file."); event.target.value = ""; return; }
    if (file.size > sizeLimit) { setError(type === "video" ? "Videos must be 20 MB or smaller." : "Photos must be 5 MB or smaller."); event.target.value = ""; return; }
    let duration = 0;
    if (type === "video") {
      try {
        duration = await readVideoDuration(file);
      } catch {
        setError("The selected video could not be read.");
        event.target.value = "";
        return;
      }
      if (!Number.isFinite(duration) || duration <= 0 || duration > 30) {
        setError("Choose a video that is 30 seconds or shorter.");
        event.target.value = "";
        return;
      }
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setMediaFile(file);
    setMediaUrl(url);
    setMediaType(type);
    setDurationSeconds(duration);
    setError("");
  };

  const publish = async (event) => {
    event.preventDefault();
    setError("");
    if (!listing || !mediaFile) { setError("Choose one of your available listings and add a photo or video."); return; }
    setBusy(true);
    try {
      const result = await createPost({ agentId: agent.id, listingId: listing.id, file: mediaFile, mediaType, durationSeconds, caption: caption.trim().slice(0, 150) });
      if (result.error === "limit") { setError("You've reached 5 statuses in 24 hours. Try again when an older one expires."); return; }
      if (result.error === "listing_unavailable") { setError("Choose a listing that is currently available."); return; }
      if (result.error === "media_storage_unavailable") { setError("Could not save this media. Check browser storage and try again."); return; }
      if (result.error) { setError("Choose a photo or video file and try again."); return; }
      setListingId("");
      setMediaFile(null);
      setMediaUrl("");
      setMediaType("image");
      setDurationSeconds(0);
      setCaption("");
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
      formRef.current?.reset();
    } catch {
      setError("Could not save this status. Check available browser storage and try again.");
    } finally {
      setBusy(false);
    }
  };

  const draft = listing && mediaUrl ? {
    id: "status-preview", agentId: agent.id, type: listing.listingType === "sale" ? "buy" : "rent",
    mediaUrl, mediaType, durationSeconds, caption, price: listing.price, location: listing.location, beds: listing.beds,
    propertyType: listing.category, area: (typeof listing.area === "string" && listing.area) || profile.area || "Lekki", sqft: listing.sqft, agentPhone: workspace.profile.phone,
    createdAt: previewTime, expiresAt: new Date(new Date(previewTime).getTime() + 86400000).toISOString(),
  } : null;

  return <section className="status-form-card" aria-labelledby="status-form-title">
    <div className="status-form-heading"><span className="status-form-icon"><ImagePlus size={20} /></span><div><h2 id="status-form-title">Post a status</h2><p>Share a property photo or video. It stays up for 24 hours.</p></div></div>
    <form className="status-post-form" ref={formRef} onSubmit={publish}>
      <label>Property listing<select required value={listingId} onChange={(event) => setListingId(event.target.value)}><option value="">Choose one of your listings</option>{listings.map((item) => <option value={item.id} key={item.id}>{item.title} · {item.location}</option>)}</select></label>
      <label>Photo or video<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" required onChange={chooseMedia} /><small>JPG, PNG, or WebP up to 5 MB · MP4 or WebM up to 20 MB and 30 seconds</small></label>
      <label>Caption <span className="status-caption-optional">Optional</span><textarea value={caption} maxLength={150} onChange={(event) => setCaption(event.target.value)} placeholder="Add a short caption"/><small>{caption.length}/150</small></label>
      {error && <p className="status-form-error" role="alert">{error}</p>}
      <button className="status-primary-action" type="submit" disabled={busy}><Send size={16} />{busy ? "Posting…" : "Post status"}</button>
    </form>
    {draft && <div className="status-preview-block"><h3>Live preview</h3><StatusPreview status={draft} agent={profile} /></div>}
  </section>;
}
