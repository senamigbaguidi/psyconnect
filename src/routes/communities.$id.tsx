import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { TopTabs } from "@/components/TopTabs";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useCommunityPermissions, type CommunityLike } from "@/hooks/useCommunityPermissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Users, MessageSquare, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/communities/$id")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: CommunityDetailScreen,
});

interface Community extends CommunityLike { id: string; name: string; description: string; }
interface Post { id: string; author_id: string; content: string; created_at: string; }

function CommunityDetailScreen() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const perms = useCommunityPermissions(community, isMember);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: c } = await supabase.from("communities").select("*").eq("id", id).maybeSingle();
    setCommunity(c as Community | null);
    const { data: m } = await supabase.from("community_members").select("id").eq("community_id", id).eq("user_id", user.id).maybeSingle();
    setIsMember(!!m);
    if (m) {
      const { data: p } = await supabase.from("community_posts")
        .select("id,author_id,content,created_at").eq("community_id", id).order("created_at", { ascending: false });
      setPosts((p as Post[]) ?? []);
    } else { setPosts([]); }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const join = async () => {
    if (!user) return;
    const { error } = await supabase.from("community_members").insert({ community_id: id, user_id: user.id });
    if (error) toast.error(error.message); else { toast.success("Bienvenue !"); load(); }
  };

  const leave = async () => {
    if (!user) return;
    await supabase.from("community_members").delete().eq("community_id", id).eq("user_id", user.id);
    load();
  };

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !perms.canPost || !content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      community_id: id, author_id: user.id, content: content.trim(),
    });
    setPosting(false);
    if (error) toast.error(error.message);
    else { setContent(""); load(); }
  };

  if (!community) {
    return (
      <div className="min-h-screen bg-background">
        <TopTabs />
        <main className="container mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Chargement...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30" />
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold">{community.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{community.description || "Aucune description."}</p>
              </div>
              <div className="flex gap-2">
                {perms.isCreator && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/communities/$id/settings" params={{ id }}>
                      <Settings className="h-4 w-4" /> Paramètres
                    </Link>
                  </Button>
                )}
                {isMember ? (
                  !perms.isCreator && <Button variant="outline" size="sm" onClick={leave}>Quitter</Button>
                ) : (
                  <Button size="sm" onClick={join}><Users className="h-4 w-4" /> Rejoindre</Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Zone de publication — visible et active uniquement si l'utilisateur a le droit de publier */}
        {isMember && (
          <Card className="mt-6 p-5">
            {perms.canPost ? (
              <form onSubmit={publish} className="space-y-3">
                <Textarea
                  value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Partagez quelque chose avec la communauté..."
                  rows={3} aria-label="Nouvelle publication"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={posting || !content.trim()}>
                    {posting ? "Publication..." : "Publier"}
                  </Button>
                </div>
              </form>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> Seul le créateur peut publier dans cette communauté.
              </p>
            )}
          </Card>
        )}

        {!isMember && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Rejoignez la communauté pour voir et participer aux discussions.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} canComment={perms.canComment} />
          ))}
          {isMember && posts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Aucune publication pour le moment.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function PostCard({ post, canComment }: { post: Post; canComment: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-5">
      <p className="whitespace-pre-wrap text-sm">{post.content}</p>
      <p className="mt-2 text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString("fr-FR")}</p>
      <div className="mt-3 border-t pt-3">
        {canComment ? (
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            <MessageSquare className="h-4 w-4" /> Commenter
          </Button>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Commentaires désactivés
          </p>
        )}
        {open && canComment && <CommentsThread postId={post.id} />}
      </div>
    </Card>
  );
}

function CommentsThread({ postId }: { postId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<{ id: string; author_id: string; content: string; created_at: string }[]>([]);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("community_comments")
      .select("id,author_id,content,created_at").eq("post_id", postId).order("created_at");
    setComments((data as any) ?? []);
  }, [postId]);

  useEffect(() => { load(); }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const { error } = await supabase.from("community_comments")
      .insert({ post_id: postId, author_id: user.id, content: text.trim() });
    if (error) toast.error(error.message);
    else { setText(""); load(); }
  };

  return (
    <div className="mt-3 space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="rounded-lg bg-muted/50 p-2 text-sm">{c.content}</div>
      ))}
      <form onSubmit={send} className="flex gap-2">
        <Textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} placeholder="Votre commentaire..." aria-label="Commentaire" />
        <Button type="submit" disabled={!text.trim()}>Envoyer</Button>
      </form>
    </div>
  );
}