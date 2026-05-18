import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLockedRoomDisplayName } from "@/lib/supabase/meet-greet-remote";
import type { CreatePollInput, PollOption, RoomPoll } from "@/lib/types/poll";

type PollRow = {
  id: string;
  topic_id: string;
  author_name: string;
  question: string;
  user_id: string | null;
  created_at: string;
};

type OptionRow = {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
};

type VoteRow = {
  poll_id: string;
  option_id: string;
  user_id: string;
};

function buildPolls(
  pollRows: PollRow[],
  optionRows: OptionRow[],
  voteRows: VoteRow[],
  currentUserId: string | null,
): RoomPoll[] {
  const votesByOption = new Map<string, number>();
  for (const vote of voteRows) {
    votesByOption.set(vote.option_id, (votesByOption.get(vote.option_id) ?? 0) + 1);
  }

  const myVoteByPoll = new Map<string, string>();
  if (currentUserId) {
    for (const vote of voteRows) {
      if (vote.user_id === currentUserId) {
        myVoteByPoll.set(vote.poll_id, vote.option_id);
      }
    }
  }

  const optionsByPoll = new Map<string, PollOption[]>();
  for (const row of optionRows) {
    const list = optionsByPoll.get(row.poll_id) ?? [];
    list.push({
      id: row.id,
      label: row.label,
      voteCount: votesByOption.get(row.id) ?? 0,
    });
    optionsByPoll.set(row.poll_id, list);
  }

  return pollRows.map((poll) => ({
    id: poll.id,
    topicId: poll.topic_id,
    authorName: poll.author_name || "Guest",
    authorUserId: poll.user_id ?? undefined,
    question: poll.question,
    options: optionsByPoll.get(poll.id) ?? [],
    createdAt: new Date(poll.created_at).getTime(),
    myVoteOptionId: myVoteByPoll.get(poll.id),
  }));
}

export async function fetchTopicPolls(
  client: SupabaseClient,
  topicId: string,
): Promise<RoomPoll[]> {
  const currentUserId = (await client.auth.getUser()).data.user?.id ?? null;

  const { data: pollRows, error: pollErr } = await client
    .from("polls")
    .select("id, topic_id, author_name, question, user_id, created_at")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  if (pollErr) throw pollErr;
  if (!pollRows?.length) return [];

  const pollIds = pollRows.map((p) => p.id as string);

  const [{ data: optionRows, error: optErr }, { data: voteRows, error: voteErr }] =
    await Promise.all([
      client
        .from("poll_options")
        .select("id, poll_id, label, sort_order")
        .in("poll_id", pollIds)
        .order("sort_order", { ascending: true }),
      client
        .from("poll_votes")
        .select("poll_id, option_id, user_id")
        .in("poll_id", pollIds),
    ]);

  if (optErr) throw optErr;
  if (voteErr) throw voteErr;

  return buildPolls(
    pollRows as PollRow[],
    (optionRows ?? []) as OptionRow[],
    (voteRows ?? []) as VoteRow[],
    currentUserId,
  );
}

export async function createPollRemote(
  client: SupabaseClient,
  input: CreatePollInput,
): Promise<RoomPoll> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const question = input.question.trim();
  const labels = input.options.map((o) => o.trim()).filter(Boolean);
  if (!question) throw new Error("Add a poll question.");
  if (labels.length < 2) throw new Error("Add at least two options.");

  const lockedName = await fetchLockedRoomDisplayName(
    client,
    input.topicId,
    user.id,
  );
  const authorName = lockedName ?? (input.authorName.trim() || "anon");

  const { data: pollRow, error: pollErr } = await client
    .from("polls")
    .insert({
      topic_id: input.topicId,
      author_name: authorName,
      question,
      user_id: user.id,
    })
    .select("id, topic_id, author_name, question, user_id, created_at")
    .single();

  if (pollErr || !pollRow) throw pollErr ?? new Error("Poll insert failed");

  const pollId = pollRow.id as string;

  const { data: optionRows, error: optErr } = await client
    .from("poll_options")
    .insert(
      labels.map((label, index) => ({
        poll_id: pollId,
        label,
        sort_order: index,
      })),
    )
    .select("id, poll_id, label, sort_order");

  if (optErr) throw optErr;

  const { error: memErr } = await client.from("topic_members").insert({
    topic_id: input.topicId,
    user_id: user.id,
  });
  if (memErr && memErr.code !== "23505") throw memErr;

  return {
    id: pollId,
    topicId: pollRow.topic_id as string,
    authorName,
    authorUserId: user.id,
    question,
    options: (optionRows ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      voteCount: 0,
    })),
    createdAt: new Date(pollRow.created_at as string).getTime(),
  };
}

export async function votePollRemote(
  client: SupabaseClient,
  pollId: string,
  optionId: string,
): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) throw new Error("Not signed in");

  const { data: option, error: optErr } = await client
    .from("poll_options")
    .select("id, poll_id")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();

  if (optErr) throw optErr;
  if (!option) throw new Error("That option is not part of this poll.");

  const { error: voteErr } = await client.from("poll_votes").upsert(
    {
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id,
    },
    { onConflict: "poll_id,user_id" },
  );

  if (voteErr) throw voteErr;
}

export function mapPollFromRealtime(
  pollRow: PollRow,
  optionRows: OptionRow[],
): RoomPoll {
  return {
    id: pollRow.id,
    topicId: pollRow.topic_id,
    authorName: pollRow.author_name || "Guest",
    authorUserId: pollRow.user_id ?? undefined,
    question: pollRow.question,
    options: optionRows
      .filter((o) => o.poll_id === pollRow.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({
        id: o.id,
        label: o.label,
        voteCount: 0,
      })),
    createdAt: new Date(pollRow.created_at).getTime(),
  };
}
