import AppError from "../../../utils/error/error.js";
import {
  findConversationByPair,
  findUsersBasic,
  listMyConversationsLight,
  upsertConversation,
} from "../../conversation/repo/conversation.repo.js";
import * as repo from "../repo/reveal.repo.js";

const NOT_FOUND = () => new AppError("Not found", 404, { code: "NOT_FOUND" });
const avatarOf = (u) => u.avatar?.url ?? null;

// Recipient asks "who sent this?". The response is the same whether or not the sender can ever
// be asked (anonymous visitor / unknown), so it never leaks whether the sender has an account.
export async function createRevealRequestService(userId, messageId) {
  const msg = await repo.findOwnedMessageWithSender(messageId, userId);
  if (!msg) throw NOT_FOUND();
  const sender = msg.sender && String(msg.sender) !== String(userId) ? msg.sender : null;

  if (sender) {
    const conv = await findConversationByPair(userId, sender);
    if (conv?.revealed.map(String).includes(String(sender))) return { status: "accepted" };
  }
  const doc = await repo.createRequest({ message: msg._id, requester: userId, target: sender });
  return { status: doc.status };
}

export async function listIncomingService(userId) {
  const reqs = await repo.pendingForTarget(userId);
  const [msgs, users] = await Promise.all([
    repo.messagesByIds(reqs.map((r) => r.message)),
    findUsersBasic([...new Set(reqs.map((r) => String(r.requester)))]),
  ]);
  const msgById = new Map(msgs.map((m) => [String(m._id), m]));
  const userById = new Map(users.map((u) => [String(u._id), u]));
  return reqs
    .filter((r) => msgById.has(String(r.message)) && userById.has(String(r.requester))) // skip deleted
    .map((r) => {
      const m = msgById.get(String(r.message));
      const u = userById.get(String(r.requester));
      return {
        id: String(r._id),
        status: r.status,
        createdAt: r.createdAt,
        requester: { id: String(u._id), name: u.name, avatarUrl: avatarOf(u), publicId: u.publicId },
        message: { id: String(m._id), content: m.content, createdAt: m.createdAt },
      };
    });
}

export const pendingCountService = async (userId) => (await listIncomingService(userId)).length;

export async function respondService(userId, requestId, action) {
  const status = action === "accept" ? "accepted" : "declined";
  const r = await repo.respond(requestId, userId, status);
  if (!r) {
    // Hide other people's requests: only say "already answered" to the actual target.
    if (await repo.existsForTarget(requestId, userId))
      throw new AppError("Already answered", 409, { code: "ALREADY_RESPONDED" });
    throw NOT_FOUND();
  }
  if (status === "declined") return { status };
  // Accepting = "I agree to be identified to the requester": open/extend the shared thread.
  const conv = await upsertConversation(userId, r.requester);
  await repo.resolveSamePair(userId, r.requester);
  return { status, conversationId: String(conv._id) };
}

// Decorates the recipient's inbox: per-message request state + sender identity ONLY when that
// sender consented (accepted a request) -- never otherwise.
export async function decorateInbox(userId, items) {
  if (!items.length) return [];
  const [reqs, convs] = await Promise.all([
    repo.statusesForMessages(userId, items.map((i) => i._id)),
    listMyConversationsLight(userId),
  ]);
  const statusByMsg = new Map(reqs.map((r) => [String(r.message), r.status]));
  const consentedSender = new Map(); // senderId -> conversationId
  for (const c of convs) {
    const other = c.members.map(String).find((m) => m !== String(userId));
    if (c.revealed.map(String).includes(other)) consentedSender.set(other, String(c._id));
  }
  const ids = [...new Set(items.map((i) => i.sender && String(i.sender)).filter((s) => s && consentedSender.has(s)))];
  const users = new Map((await findUsersBasic(ids)).map((u) => [String(u._id), u]));

  return items.map((m) => {
    const s = m.sender ? String(m.sender) : null;
    const u = s && users.get(s);
    return {
      id: String(m._id),
      content: m.content,
      createdAt: m.createdAt,
      reveal: u ? "accepted" : (statusByMsg.get(String(m._id)) ?? "none"),
      from: u ? { id: String(u._id), name: u.name, avatarUrl: avatarOf(u), publicId: u.publicId } : null,
      conversationId: u ? consentedSender.get(s) : null,
    };
  });
}
