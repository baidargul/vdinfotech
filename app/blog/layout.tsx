import Link from "next/link";
import { SiteHeader } from "@/app/interactive";

export default function BlogLayout({ children }: LayoutProps<"/blog">) {
  return <><SiteHeader />{children}<footer className="blog-footer"><div className="shell"><Link className="brand" href="/"><span className="brand-mark">VD</span><span><strong>VD INFOTECH</strong><small>Ideas. Engineered.</small></span></Link><p>Practical thinking on product, design, engineering, and growth.</p><div><Link href="/">Home</Link><Link href="/blog">Blog</Link><a href="mailto:hello@vdinfotech.com">Contact</a></div></div></footer></>;
}
