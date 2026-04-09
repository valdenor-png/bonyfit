import { supabase } from './supabase';
import type { Post, PostComment, Message, Block, Report } from '../types/social';
import type { User } from '../types/user';

const PAGE_SIZE = 20;

export async function getFeedPosts(page: number = 1): Promise<Post[]> {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Get blocked user ids so we can exclude them
  let blockedIds: string[] = [];
  if (authUser) {
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', authUser.id);

    blockedIds = (blocks ?? []).map((b) => b.blocked_id);
  }

  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (blockedIds.length > 0) {
    query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Attach liked_by_me flag
  if (!authUser || !data) return (data ?? []) as Post[];

  const postIds = data.map((p: any) => p.id);
  const { data: likes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', authUser.id)
    .in('post_id', postIds);

  const likedSet = new Set((likes ?? []).map((l) => l.post_id));

  return data.map((p: any) => ({
    ...p,
    liked_by_me: likedSet.has(p.id),
  })) as Post[];
}

export async function createPost(
  userId: string,
  text: string,
  imageUri: string | null,
  hashtags: string[],
): Promise<Post> {
  let imageUrl: string | null = null;

  if (imageUri) {
    const fileName = `${userId}/${Date.now()}.jpg`;
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(fileName, blob, { contentType: 'image/jpeg' });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('posts').getPublicUrl(fileName);

    imageUrl = publicUrl;
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      text,
      image_url: imageUrl,
      hashtags,
      likes_count: 0,
      comments_count: 0,
      points_earned: 0,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, liked_by_me: false } as Post;
}

export async function likePost(
  postId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId });

  if (error) throw error;

  await supabase.rpc('increment_likes', { p_post_id: postId, p_delta: 1 });
}

export async function unlikePost(
  postId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw error;

  await supabase.rpc('increment_likes', { p_post_id: postId, p_delta: -1 });
}

export async function getComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as PostComment[];
}

export async function addComment(
  postId: string,
  userId: string,
  text: string,
): Promise<PostComment> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      text,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Increment comment count
  await supabase.rpc('increment_comments', {
    p_post_id: postId,
    p_delta: 1,
  });

  return data as PostComment;
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  text: string,
): Promise<Message> {
  // Ensure sender hasn't been blocked by receiver
  const { data: block } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', receiverId)
    .eq('blocked_id', senderId)
    .maybeSingle();

  if (block) throw new Error('Não é possível enviar mensagem para este usuário');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      text,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export async function getMessages(
  userId1: string,
  userId2: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
    )
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<Block> {
  const { data, error } = await supabase
    .from('blocks')
    .insert({ blocker_id: blockerId, blocked_id: blockedId })
    .select()
    .single();

  if (error) throw error;
  return data as Block;
}

export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: string,
): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

export async function getUserProfile(
  userId: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from('public_user_profile')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as User) ?? null;
}
