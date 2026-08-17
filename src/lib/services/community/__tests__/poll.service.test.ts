import { describe, it, expect, vi, beforeEach } from "vitest";
import { PollService } from "../poll.service";
import { CommunityValidationError, PostNotFoundError } from "../community.errors";

function createMockSupabase() {
  const tableChains: Record<string, any> = {};

  function getTableChain(tableName: string) {
    if (!tableChains[tableName]) {
      const chain: any = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.update = vi.fn().mockReturnValue(chain);
      chain.delete = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      // To handle thenable awaiting of query results:
      chain.then = (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve);
      tableChains[tableName] = chain;
    }
    return tableChains[tableName];
  }

  const mockSupabase = {
    from: vi.fn((tableName: string) => getTableChain(tableName)),
  };

  return { mockSupabase: mockSupabase as any, getTableChain };
}

describe("PollService", () => {
  let service: PollService;
  let mockSupabase: any;
  let getTableChain: (tableName: string) => any;

  beforeEach(() => {
    const mocks = createMockSupabase();
    mockSupabase = mocks.mockSupabase;
    getTableChain = mocks.getTableChain;
    service = new PollService(mockSupabase);
  });

  describe("votePoll", () => {
    it("casts vote on poll post", async () => {
      const postChain = getTableChain("community_posts");
      const voteChain = getTableChain("community_poll_votes");

      postChain.maybeSingle.mockResolvedValue({
        data: { id: "poll-1", type: "poll", metadata: { options: ["Option A", "Option B"] } },
        error: null,
      });
      voteChain.maybeSingle.mockResolvedValue({ data: null, error: null });
      voteChain.then = (resolve: any) =>
        Promise.resolve({ data: [{ option_index: 0, user_id: "user-1" }], error: null }).then(resolve);

      const result = await service.votePoll("poll-1", "user-1", 0);

      expect(voteChain.insert).toHaveBeenCalled();
      expect(result.optionIndex).toBe(0);
    });

    it("throws CommunityValidationError on invalid option index", async () => {
      const postChain = getTableChain("community_posts");
      postChain.maybeSingle.mockResolvedValue({
        data: { id: "poll-1", type: "poll", metadata: { options: ["Option A", "Option B"] } },
        error: null,
      });

      await expect(service.votePoll("poll-1", "user-1", 99)).rejects.toBeInstanceOf(
        CommunityValidationError,
      );
    });
  });
});
