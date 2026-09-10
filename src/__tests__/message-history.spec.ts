import { beforeEach, expect, it, vi } from "vitest";
import { fetchConversationSummaries, fetchMessagePage, mergeMessages } from "@/lib/message-history";
import type { DMMessage } from "@/lib/dms";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("@/integrations/supabase/client", async () => {
  const { createClient } = await import("@supabase/supabase-js");
  return { supabase: createClient("https://test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: mocks.fetch },
  }) };
});
const row = (id: number): DMMessage => ({ id: `00000000-0000-0000-0000-${String(id).padStart(12, "0")}`, conversation_id: "chat", sender_id: "scout", content: `Message ${id}`, created_at: "2026-09-10T10:00:00.123456+00:00" });
const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "Content-Type": "application/json" } });
beforeEach(() => vi.clearAllMocks());
it("loads bounded pages without losing messages sharing the same timestamp", async () => {
  const records = Array.from({ length: 101 }, (_, id) => row(id));
  mocks.fetch.mockImplementation(async (input: string) => {
    const url = new URL(input);
    const cursor = url.searchParams.get("or")?.match(/id\.lt\.([\da-f-]+)/)?.[1];
    const available = records.filter(message => !cursor || message.id < cursor).reverse();
    expect(url.searchParams.get("order")).toBe("created_at.desc,id.desc");
    return response(available.slice(0, Number(url.searchParams.get("limit"))));
  });
  const first = await fetchMessagePage("chat");
  const second = await fetchMessagePage("chat", first.messages[0]);
  const last = await fetchMessagePage("chat", second.messages[0]);
  expect(first.messages).toHaveLength(50); expect(first.hasMore).toBe(true);
  expect(second.messages).toHaveLength(50); expect(last.hasMore).toBe(false);
  expect(mergeMessages(mergeMessages(first.messages, second.messages), last.messages)).toEqual(records);
});
it("deduplicates a realtime message also returned by the initial query", () => {
  expect(mergeMessages([row(2), row(1)], [row(2), row(3)])).toEqual([row(1), row(2), row(3)]);
});
it("orders microseconds correctly across equivalent timestamp formats", () => {
  const earlier = { ...row(3), created_at: "2026-09-10T10:00:00.123001Z" };
  const later = { ...row(1), created_at: "2026-09-10T10:00:00.123002+00:00" };
  expect(mergeMessages([later], [earlier])).toEqual([earlier, later]);
});
it("requests only one nested message per authorized conversation", async () => {
  mocks.fetch.mockResolvedValue(response([{ id: "chat", created_at: row(1).created_at, last_message_at: null,
    messages: [row(1)], conversation_participants: [{ user_id: "me" }, { user_id: "scout" }],
  }]));
  expect(await fetchConversationSummaries("me")).toMatchObject([{ id: "chat", other_user_id: "scout", last_message_content: "Message 1" }]);
  const url = new URL(mocks.fetch.mock.calls[0]![0]);
  expect(url.searchParams.get("membership.user_id")).toBe("eq.me");
  expect(url.searchParams.get("messages.limit")).toBe("1");
  expect(url.searchParams.get("messages.order")).toBe("created_at.desc,id.desc");
});
it("rejects invalid cursors without making a request", async () => {
  await expect(fetchMessagePage("chat", { id: "malformed),content.neq.x", created_at: row(1).created_at })).rejects.toThrow("Cursor");
  expect(mocks.fetch).not.toHaveBeenCalled();
});
