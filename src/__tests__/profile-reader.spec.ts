import { beforeEach, expect, it, vi } from "vitest";
import { invalidateProfileReads, readOwnProfile } from "@/lib/profile-reader";

const mocks = vi.hoisted(() => ({ session: vi.fn(), query: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: mocks.session },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.query }) }) }),
} }));
beforeEach(() => {
  vi.clearAllMocks(); invalidateProfileReads();
  mocks.session.mockResolvedValue({ data: { session: { user: { id: "scout" }, access_token: "first" } } });
});
it("shares simultaneous requests but refetches once they settle", async () => {
  let finish!: (value: { data: { user_id: string }; error: null }) => void;
  mocks.query.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const first = readOwnProfile("scout"); const second = readOwnProfile("scout");
  await vi.waitFor(() => expect(mocks.query).toHaveBeenCalledOnce());
  finish({ data: { user_id: "scout" }, error: null });
  expect(await first).toEqual(await second);
  mocks.query.mockResolvedValue({ data: null, error: null });
  await readOwnProfile("scout");
  expect(mocks.query).toHaveBeenCalledTimes(2);
});
it("never shares an old token's pending request with a refreshed session", async () => {
  let finish!: (value: { data: null; error: null }) => void;
  mocks.query.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const old = readOwnProfile("scout");
  await vi.waitFor(() => expect(mocks.query).toHaveBeenCalledOnce());
  mocks.session.mockResolvedValue({ data: { session: { user: { id: "scout" }, access_token: "new" } } });
  mocks.query.mockResolvedValue({ data: { account_status: "suspendido" }, error: null });
  expect((await readOwnProfile("scout")).data?.account_status).toBe("suspendido");
  finish({ data: null, error: null }); await old;
  expect(mocks.query).toHaveBeenCalledTimes(2);
});
it("does not query after logout or for a different session owner", async () => {
  expect(await readOwnProfile("another-user")).toEqual({ data: null, error: null });
  mocks.session.mockResolvedValue({ data: { session: null } });
  await readOwnProfile("scout");
  expect(mocks.query).not.toHaveBeenCalled();
});
it("invalidates pending reads before a profile refresh", async () => {
  let finish!: (value: { data: null; error: null }) => void;
  mocks.query.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const old = readOwnProfile("scout");
  await vi.waitFor(() => expect(mocks.query).toHaveBeenCalledOnce());
  invalidateProfileReads();
  mocks.query.mockResolvedValue({ data: null, error: null });
  await readOwnProfile("scout"); finish({ data: null, error: null }); await old;
  expect(mocks.query).toHaveBeenCalledTimes(2);
});
