import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "message"
  | "follow_request"
  | "follow_accepted"
  | "mention"
  | "group_invite"
  | "gallery_upload"
  | "new_follower"
  | "rama_broadcast";

export interface CreateNotificationParams {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
}

export async function createNotification({
  recipientId,
  actorId,
  type,
  entityType,
  entityId,
  data,
}: CreateNotificationParams): Promise<void> {
  if (recipientId === actorId) return;
  const { error } = await supabase.rpc("create_notification", {
    p_recipient: recipientId,
    p_actor: actorId,
    p_type: type,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_data: data,
  });
  if (error) {
    console.warn("createNotification RPC failed:", error.message);
  }
}

export async function createDMNotification({
  senderId,
  recipientId,
  conversationId,
  messageId,
  content,
  senderDisplayName,
  senderUsername,
  senderAvatarUrl,
}: {
  senderId: string;
  recipientId: string;
  conversationId: string;
  messageId: string;
  content: string;
  senderDisplayName: string;
  senderUsername: string | null;
  senderAvatarUrl: string | null;
}): Promise<void> {
  await createNotification({
    recipientId,
    actorId: senderId,
    type: "message",
    entityType: "message",
    entityId: messageId,
    data: {
      conversation_id: conversationId,
      message_id: messageId,
      sender_id: senderId,
      content,
      display: senderDisplayName,
      username: senderUsername,
      avatar_url: senderAvatarUrl,
      kind: "message",
    },
  });
}

export async function createFollowNotification({
  followerId,
  followedId,
  status,
  followerDisplayName,
  followerUsername,
  followerAvatarUrl,
}: {
  followerId: string;
  followedId: string;
  status: "pending" | "accepted";
  followerDisplayName: string;
  followerUsername: string | null;
  followerAvatarUrl: string | null;
}): Promise<void> {
  const kind = status === "accepted" ? "follow_accepted" : "follow_request";
  await createNotification({
    recipientId: followedId,
    actorId: followerId,
    type: kind as NotificationType,
    entityType: "follow",
    entityId: `${followerId}:${followedId}`,
    data: {
      follower_id: followerId,
      display: followerDisplayName,
      username: followerUsername,
      avatar_url: followerAvatarUrl,
      kind,
    },
  });
}

export async function createFollowAcceptedNotification({
  followerId,
  followedId,
  followedDisplayName,
  followedUsername,
  followedAvatarUrl,
}: {
  followerId: string;
  followedId: string;
  followedDisplayName: string;
  followedUsername: string | null;
  followedAvatarUrl: string | null;
}): Promise<void> {
  await createNotification({
    recipientId: followerId,
    actorId: followedId,
    type: "follow_accepted",
    entityType: "follow",
    entityId: `${followerId}:${followedId}`,
    data: {
      follower_id: followerId,
      followed_id: followedId,
      display: followedDisplayName,
      username: followedUsername,
      avatar_url: followedAvatarUrl,
      kind: "follow_accepted",
    },
  });
}
