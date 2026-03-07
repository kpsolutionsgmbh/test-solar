export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  company_name: string;
  company_logo_url: string | null;
  brand_color: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  admin_id: string;
  name: string;
  position: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Dealroom {
  id: string;
  admin_id: string;
  slug: string;
  status: 'draft' | 'published' | 'signed' | 'inactive' | 'archived';
  client_name: string;
  client_company: string;
  client_position: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  client_logo_url: string | null;
  video_url: string | null;
  pandadoc_embed_url: string | null;
  ai_input_text: string | null;
  ai_input_audio_url: string | null;
  generated_content: DealroomContent | null;
  custom_content: DealroomContent | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  language: 'de' | 'en';
  assigned_member_id: string | null;
}

export interface DealroomContent {
  hero_title: string;
  hero_subtitle: string;
  situation_points: Array<{
    icon: string;
    text: string;
    // New fields for dark card layout (heading + subtext)
    emoji?: string;
    heading?: string;
    subtext?: string;
  }>;
  goal: string;
  approach: string;
  cost_of_inaction: {
    headline: string;
    consequences: Array<{
      icon: string;
      text: string;
      emoji?: string;
      heading?: string;
      subtext?: string;
    }>;
  };
  outcome_vision: Array<string | { text: string; detail?: string }>;
  outcome_quote?: string;
  process_steps: Array<{
    step: number;
    title: string;
    duration: string;
    effort: string;
    description: string;
    customer_action?: string;
  }>;
  guarantee_title?: string;
  guarantee_text: string;
  cta_text: string;
  cta_derisking?: string;
}

export interface TrackingEvent {
  id: string;
  dealroom_id: string;
  event_type: TrackingEventType;
  event_data: Record<string, unknown> | null;
  visitor_ip: string | null;
  user_agent: string | null;
  session_id: string;
  created_at: string;
}

export type TrackingEventType =
  | 'page_view'
  | 'tab_switch'
  | 'video_play'
  | 'video_complete'
  | 'pandadoc_open'
  | 'pandadoc_sign'
  | 'scroll_depth'
  | 'cta_click'
  | 'session_end';

export interface Reference {
  id: string;
  admin_id: string;
  client_name: string;
  client_company: string;
  quote: string | null;
  logo_url: string | null;
  result_summary: string | null;
  situation_text: string | null;
  method_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  video_url: string | null;
  image_url: string | null;
}
