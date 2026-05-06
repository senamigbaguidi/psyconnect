import { useAuth } from "@/lib/auth-context";

export function useCanCreateCommunity() {
  const { roles } = useAuth();
  return roles.includes("admin") || roles.includes("expert");
}

export interface CommunityLike {
  creator_id: string;
  can_members_post: boolean;
  can_members_comment: boolean;
}

/** Permissions métier d'une communauté pour l'utilisateur courant. */
export function useCommunityPermissions(community: CommunityLike | null, isMember: boolean) {
  const { user } = useAuth();
  if (!community || !user) return { isCreator: false, canPost: false, canComment: false, isMember };
  const isCreator = community.creator_id === user.id;
  return {
    isCreator,
    // Le créateur peut toujours publier ; les membres seulement si l'option est activée
    canPost: isMember && (isCreator || community.can_members_post),
    // Idem pour les commentaires
    canComment: isMember && (isCreator || community.can_members_comment),
    isMember,
  };
}