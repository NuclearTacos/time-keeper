"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useActiveTags() {
  const tags = useQuery(api.userSettings.getActiveTags) ?? [];
  const setActiveTags = useMutation(api.userSettings.setActiveTags);

  function addTag(tag: string) {
    const normalized = tag.toLowerCase().replace(/^#/, "");
    if (!normalized || tags.includes(normalized)) return;
    setActiveTags({ tags: [...tags, normalized] });
  }

  function removeTag(tag: string) {
    setActiveTags({ tags: tags.filter((t) => t !== tag) });
  }

  return { tags, addTag, removeTag };
}
