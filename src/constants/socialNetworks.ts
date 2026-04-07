export interface SocialNetwork {
  id: string;
  name: string;
  color: string;
  emoji: string;
  placeholder: string;
}

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  { id: 'instagram', name: 'Instagram', color: '#E4405F', emoji: '📸', placeholder: 'https://instagram.com/seuuser' },
  { id: 'tiktok', name: 'TikTok', color: '#FFFFFF', emoji: '🎵', placeholder: 'https://tiktok.com/@seuuser' },
  { id: 'twitter', name: 'X / Twitter', color: '#FFFFFF', emoji: '𝕏', placeholder: 'https://x.com/seuuser' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', emoji: '👤', placeholder: 'https://facebook.com/seuuser' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', emoji: '▶', placeholder: 'https://youtube.com/@seucanal' },
  { id: 'twitch', name: 'Twitch', color: '#9146FF', emoji: '🎮', placeholder: 'https://twitch.tv/seuuser' },
  { id: 'spotify', name: 'Spotify', color: '#1DB954', emoji: '🎧', placeholder: 'https://open.spotify.com/user/seuuser' },
  { id: 'threads', name: 'Threads', color: '#FFFFFF', emoji: '@', placeholder: 'https://threads.net/@seuuser' },
];
