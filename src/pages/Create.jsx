import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageIntro from "../components/PageIntro";
import Avatar from "../components/Avatar";
export default function Create(){ const [text,setText]=useState(""); const navigate=useNavigate(); return <><PageIntro title="Say something." description="Write a post now. Media and attachments can come later."/><section className="create-panel"><div className="create-author"><Avatar/><span><strong>Priyam</strong><small>@priyam</small></span></div><textarea value={text} onChange={e=>setText(e.target.value)} maxLength={500} autoFocus placeholder="What's on your mind?"/><footer><span>{text.length} / 500</span><button disabled={!text.trim()} onClick={()=>navigate("/")}>Post</button></footer></section></>; }
