"use client";

import Link from "next/link";
import {
  movePostToTrashAction,
  permanentlyDeletePostAction,
  restorePostAction,
  unpublishPostAction,
} from "@/app/actions/posts";

export function PostRowActions({ postId, published }: { postId: string; published: boolean }) {
  return <div className="post-row-actions"><Link href={`/dashboard/posts/${postId}/edit`}>Edit</Link><Link href={`/dashboard/posts/${postId}/preview`} target="_blank">Preview</Link>{published && <form action={unpublishPostAction}><input type="hidden" name="postId" value={postId} /><button type="submit">Unpublish</button></form>}<form action={movePostToTrashAction} onSubmit={(event) => { if (!window.confirm("Move this post to trash?")) event.preventDefault(); }}><input type="hidden" name="postId" value={postId} /><button className="danger-link" type="submit">Trash</button></form></div>;
}

export function TrashRowActions({ postId }: { postId: string }) {
  return <div className="post-row-actions"><form action={restorePostAction}><input type="hidden" name="postId" value={postId} /><button type="submit">Restore</button></form><form action={permanentlyDeletePostAction} onSubmit={(event) => { if (!window.confirm("Permanently delete this post and all of its images? This cannot be undone.")) event.preventDefault(); }}><input type="hidden" name="postId" value={postId} /><button className="danger-link" type="submit">Delete forever</button></form></div>;
}
