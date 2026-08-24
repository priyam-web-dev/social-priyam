export default function PageIntro({ eyebrow = "YOUR SPACE", title, description }) {
  return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}
