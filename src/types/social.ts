export interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  unit_name: string;
  text: string;
  image_url: string | null;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  points_earned: number;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  text: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  created_at: string;
}
