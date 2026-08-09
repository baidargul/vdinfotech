"use client";

import Link from "next/link";
import NextImage from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import { savePostAction, type PostFormState } from "@/app/actions/posts";
import { AdvancedLinkDialog, type AdvancedLinkValue } from "./advanced-link-dialog";

export type EditablePost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  contentHtml: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  status: "draft" | "published";
  cover: { id: string; url: string; altText: string } | null;
};

type UploadedMedia = { id: string; url: string; altText: string };

const RichTextLink = TiptapLink.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      download: {
        default: null,
        parseHTML: (element) => element.hasAttribute("download") ? element.getAttribute("download") || "" : null,
        renderHTML: (attributes) => attributes.download !== null ? { download: attributes.download || "" } : {},
      },
    };
  },
});

function ErrorText({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="editor-error">{errors.join(" ")}</p> : null;
}

function EditorSubmit({ intent, children }: { intent: "draft" | "publish" | "schedule"; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button className={`editor-submit editor-${intent}`} type="submit" name="intent" value={intent} disabled={pending}>{pending ? "Saving..." : children}</button>;
}

async function uploadImage(file: File, altText = ""): Promise<UploadedMedia> {
  const data = new FormData();
  data.set("image", file);
  data.set("altText", altText);
  const response = await fetch("/api/media", { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Image upload failed.");
  return result;
}

async function deleteUnattachedMedia(url: string) {
  const id = /\/media\/([a-f0-9]{24})/.exec(url)?.[1];
  if (id) await fetch(`/api/media/${id}`, { method: "DELETE" }).catch(() => undefined);
}

export function PostEditor({ post }: { post?: EditablePost }) {
  const initialState: PostFormState = {};
  const [state, formAction] = useActionState(savePostAction, initialState);
  const [contentHtml, setContentHtml] = useState(post?.contentHtml || "<p></p>");
  const [cover, setCover] = useState<UploadedMedia | null>(post?.cover || null);
  const [uploading, setUploading] = useState<"cover" | "inline" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; value: AdvancedLinkValue }>({
    open: false,
    value: { href: "", target: "_blank", rel: "noopener noreferrer", download: null },
  });
  const inlineInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const linkButton = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      RichTextLink.configure({ openOnClick: false }),
      Image.configure({ allowBase64: false, HTMLAttributes: { loading: "lazy" } }),
    ],
    content: post?.contentHtml || "<p></p>",
    editorProps: { attributes: { class: "post-editor-surface", "aria-label": "Post content" } },
    onUpdate({ editor: currentEditor }) {
      setContentHtml(currentEditor.getHTML());
      setDirty(true);
    },
  });

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const handleUpload = async (file: File, type: "cover" | "inline") => {
    setUploadError("");
    setUploading(type);
    try {
      const media = await uploadImage(file, type === "cover" ? "Post cover image" : "Post image");
      if (type === "cover") {
        if (cover && cover.id !== post?.cover?.id) await deleteUnattachedMedia(cover.url);
        setCover(media);
      } else {
        editor?.chain().focus().setImage({ src: media.url, alt: media.altText || "Post image" }).run();
      }
      setDirty(true);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const removeCover = async () => {
    if (cover && cover.id !== post?.cover?.id) await deleteUnattachedMedia(cover.url);
    setCover(null);
    setDirty(true);
  };

  const openLinkDialog = () => {
    if (!editor) return;
    const attributes = editor.getAttributes("link");
    setLinkDialog({ open: true, value: {
      href: String(attributes.href || ""),
      target: attributes.target === "_blank" ? "_blank" : null,
      rel: attributes.rel ? String(attributes.rel) : null,
      download: attributes.download !== null && attributes.download !== undefined ? String(attributes.download) : null,
    } });
  };

  const closeLinkDialog = () => {
    setLinkDialog({ open: false, value: { href: "", target: "_blank", rel: "noopener noreferrer", download: null } });
    requestAnimationFrame(() => linkButton.current?.focus());
  };

  const removeSelectedImage = async () => {
    if (!editor || !editor.isActive("image")) return;
    const src = String(editor.getAttributes("image").src || "");
    editor.chain().focus().deleteSelection().run();
    if (!post || !post.contentHtml.includes(src)) await deleteUnattachedMedia(src);
  };

  const localScheduleValue = post?.publishedAt
    ? new Date(post.publishedAt).toISOString().slice(0, 16)
    : "";

  return (
    <form className="post-editor-form" action={formAction} onChange={() => setDirty(true)} onSubmit={() => setDirty(false)}>
      <input type="hidden" name="postId" value={post?.id || ""} />
      <input type="hidden" name="contentHtml" value={contentHtml} />
      <input type="hidden" name="coverMediaId" value={cover?.id || ""} />
      <input type="hidden" name="timezoneOffset" value={new Date().getTimezoneOffset()} />

      <div className="editor-page-heading">
        <div><p className="eyebrow"><span /> {post ? "Edit post" : "New post"}</p><h1>{post ? "Shape your story." : "Start a new story."}</h1></div>
        <div className="editor-heading-actions">
          {post && <Link href={`/dashboard/posts/${post.id}/preview`} target="_blank">Preview ↗</Link>}
          <EditorSubmit intent="draft">Save draft</EditorSubmit>
          <EditorSubmit intent="publish">Publish now</EditorSubmit>
        </div>
      </div>

      {state.message && <p className={state.success ? "editor-notice is-success" : "editor-notice"} role="status">{state.message}</p>}

      <div className="editor-layout">
        <div className="editor-main">
          <label className="editor-field"><span>Post title</span><input name="title" defaultValue={post?.title} placeholder="A clear, compelling title" maxLength={160} required /><ErrorText errors={state.errors?.title} /></label>
          <label className="editor-field"><span>Excerpt</span><textarea name="excerpt" defaultValue={post?.excerpt} placeholder="A short summary readers will see on post cards" maxLength={320} rows={3} required /><ErrorText errors={state.errors?.excerpt} /></label>

          <div className="rich-editor-wrap">
            <div className="rich-editor-label"><span>Content</span><small>Rich text</small></div>
            <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
              <button type="button" className={editor?.isActive("bold") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBold().run()}><strong>B</strong></button>
              <button type="button" className={editor?.isActive("italic") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleItalic().run()}><em>I</em></button>
              <button type="button" className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
              <button type="button" className={editor?.isActive("heading", { level: 3 }) ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
              <button type="button" className={editor?.isActive("bulletList") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
              <button type="button" className={editor?.isActive("orderedList") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
              <button type="button" className={editor?.isActive("blockquote") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>Quote</button>
              <button type="button" className={editor?.isActive("codeBlock") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>Code</button>
              <button ref={linkButton} type="button" className={editor?.isActive("link") ? "is-active" : ""} onClick={openLinkDialog}>Link</button>
              <button type="button" onClick={() => inlineInput.current?.click()} disabled={uploading === "inline"}>{uploading === "inline" ? "Uploading..." : "Image"}</button>
              {editor?.isActive("image") && <button type="button" onClick={removeSelectedImage}>Remove image</button>}
              <button type="button" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>Undo</button>
              <button type="button" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>Redo</button>
              <input ref={inlineInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file, "inline"); event.target.value = ""; }} />
            </div>
            <EditorContent editor={editor} />
            <ErrorText errors={state.errors?.contentHtml} />
          </div>
        </div>

        <aside className="editor-settings">
          <section className="editor-settings-card">
            <h2>Publishing</h2>
            <label className="editor-field"><span>Schedule date and time</span><input name="publishedAt" type="datetime-local" defaultValue={localScheduleValue} /><ErrorText errors={state.errors?.publishedAt} /></label>
            <EditorSubmit intent="schedule">Schedule post</EditorSubmit>
            <p>Dates are converted from your browser&apos;s local time.</p>
          </section>
          <section className="editor-settings-card">
            <h2>Organization</h2>
            <label className="editor-field"><span>Category</span><input name="category" defaultValue={post?.category} placeholder="Engineering" maxLength={60} required /><ErrorText errors={state.errors?.category} /></label>
            <label className="editor-field"><span>Tags</span><input name="tags" defaultValue={post?.tags.join(", ")} placeholder="next.js, product, design" /><small>Up to 8 comma-separated tags</small><ErrorText errors={state.errors?.tags} /></label>
          </section>
          <section className="editor-settings-card">
            <h2>Cover image</h2>
            {cover ? <div className="cover-preview"><NextImage src={cover.url} alt={cover.altText || "Post cover preview"} width={600} height={300} unoptimized /><button type="button" onClick={removeCover}>Remove</button></div> : <button className="cover-upload" type="button" onClick={() => coverInput.current?.click()} disabled={uploading === "cover"}>{uploading === "cover" ? "Uploading..." : "+ Upload cover image"}</button>}
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleUpload(file, "cover"); event.target.value = ""; }} />
            {uploadError && <p className="editor-error">{uploadError}</p>}
            <small>JPEG, PNG, WebP or GIF · max 5 MB</small>
          </section>
          <details className="editor-settings-card editor-seo" open>
            <summary>Search appearance</summary>
            <label className="editor-field"><span>SEO title</span><input name="seoTitle" defaultValue={post?.seoTitle} maxLength={70} placeholder="Defaults to post title" /><ErrorText errors={state.errors?.seoTitle} /></label>
            <label className="editor-field"><span>SEO description</span><textarea name="seoDescription" defaultValue={post?.seoDescription} maxLength={170} rows={4} placeholder="Defaults to excerpt" /><ErrorText errors={state.errors?.seoDescription} /></label>
          </details>
        </aside>
      </div>
      {linkDialog.open && <AdvancedLinkDialog
        initialValue={linkDialog.value}
        postId={post?.id}
        onClose={closeLinkDialog}
        onApply={(value) => {
          editor?.chain().focus().extendMarkRange("link").setMark("link", value).run();
          closeLinkDialog();
          setDirty(true);
        }}
        onRemove={() => {
          const downloadId = /^\/download\/([a-f0-9]{24})$/.exec(linkDialog.value.href)?.[1];
          editor?.chain().focus().extendMarkRange("link").unsetLink().run();
          if (downloadId && !post?.contentHtml.includes(linkDialog.value.href)) {
            void fetch(`/api/files/${downloadId}`, { method: "DELETE" });
          }
          closeLinkDialog();
          setDirty(true);
        }}
      />}
    </form>
  );
}
