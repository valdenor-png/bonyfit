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

export interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  members_count: number;
  is_member: boolean;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'inter_unit';
  start_date: string;
  end_date: string;
  goal: number;
  current_progress: number;
  participants_count: number;
  prize_points: number;
  prize_badge: string;
  status: 'active' | 'available' | 'completed';
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
