import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import type { DMMessage } from "@/lib/dms";

const mocks = vi.hoisted(() => ({ fetchPage: vi.fn(), remove: vi.fn(), listeners: new Map<string, (payload: { new: unknown }) => void>() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  channel: (name: string) => { const channel = {
    on: (_type: string, _filter: unknown, callback: (payload: { new: unknown }) => void) => { mocks.listeners.set(name, callback); return channel; },
    subscribe: () => channel,
  }; return channel; },
  removeChannel: mocks.remove,
} }));
vi.mock("@/lib/message-history", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/message-history")>(), fetchMessagePage: mocks.fetchPage,
}));
const message = (id: string, conversation_id = "a"): DMMessage => ({ id, conversation_id, sender_id: "scout", content: id, created_at: `2026-09-10T10:00:0${id}Z` });
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; };
type Page = { messages: DMMessage[]; hasMore: boolean };
beforeEach(() => { vi.clearAllMocks(); mocks.listeners.clear(); });
afterEach(cleanup);
it("merges realtime inserts arriving before the initial history response", async () => {
  const pending = deferred<Page>(); mocks.fetchPage.mockReturnValue(pending.promise);
  const { result } = renderHook(() => useConversationMessages("a"));
  act(() => mocks.listeners.get("message-history:a")!({ new: message("2") }));
  await act(async () => { pending.resolve({ messages: [message("1"), message("2")], hasMore: false }); });
  expect(result.current.messages.map(row => row.id)).toEqual(["1", "2"]);
  act(() => result.current.append(message("2")));
  expect(result.current.messages).toHaveLength(2);
});
it("ignores old conversation responses after switching chats", async () => {
  const pending = deferred<Page>(); mocks.fetchPage.mockReturnValueOnce(pending.promise).mockResolvedValue({ messages: [message("3", "b")], hasMore: false });
  const { result, rerender } = renderHook(({ id }) => useConversationMessages(id), { initialProps: { id: "a" } });
  rerender({ id: "b" });
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => pending.resolve({ messages: [message("1")], hasMore: false }));
  expect(result.current.messages).toEqual([message("3", "b")]);
  expect(mocks.remove).toHaveBeenCalled();
});
it("prepends older pages and prevents simultaneous duplicate loads", async () => {
  mocks.fetchPage.mockResolvedValueOnce({ messages: [message("2")], hasMore: true });
  const { result } = renderHook(() => useConversationMessages("a"));
  await waitFor(() => expect(result.current.loading).toBe(false));
  const pending = deferred<Page>(); mocks.fetchPage.mockReturnValue(pending.promise);
  let request!: Promise<boolean>;
  act(() => { request = result.current.loadOlder(); void result.current.loadOlder(); });
  expect(mocks.fetchPage).toHaveBeenCalledTimes(2);
  await act(async () => { pending.resolve({ messages: [message("1")], hasMore: false }); await request; });
  expect(result.current.messages.map(row => row.id)).toEqual(["1", "2"]);
  expect(result.current.hasMore).toBe(false);
});
it("reports failures and allows retrying the history", async () => {
  mocks.fetchPage.mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ messages: [message("1")], hasMore: false });
  const { result } = renderHook(() => useConversationMessages("a"));
  await waitFor(() => expect(result.current.error).toBe("offline"));
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.messages).toHaveLength(1));
  expect(result.current.error).toBeNull();
});
