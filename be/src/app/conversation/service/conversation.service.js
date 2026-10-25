import AppError from "../../../utils/error/error.js";
import * as repo from "../repo/conversation.repo.js";

const NOT_FOUND = () =>
  new AppError("Conversation not found", 404, { code: "NOT_FOUND" });

const mine = (me) => (m) => ({
  id: String(m._id),
  content: m.content,
  createdAt: m.createdAt,
  mine: String(m.sender) === String(me),
});

export async function listConversationsService(me) {
  const convs = await repo.listMyConversations(me);
  const otherIds = convs.map((c) =>
    c.members.map(String).find((m) => m !== String(me)),
  );
  const users = new Map(
    (await repo.findUsersBasic([...new Set(otherIds)])).map((u) => [
      String(u._id),
      u,
    ]),
  );
  return convs.flatMap((c, i) => {
    const u = users.get(otherIds[i]);
    if (!u) return [];
    return [
      {
        id: String(c._id),
        lastMessageAt: c.lastMessageAt,
        other: {
          id: String(u._id),
          name: u.name,
          avatarUrl: u.avatar?.url ?? null,
          publicId: u.publicId,
        },
      },
    ];
  });
}

async function getOwn(me, id) {
  const conv = await repo.findMyConversation(id, me); // membership is part of the query
  if (!conv) throw NOT_FOUND();
  return conv;
}

export async function threadService(me, id, query) {
  const conv = await getOwn(me, id);
  const { items, nextCursor, other } = await repo.threadMessages(
    conv,
    me,
    query,
  );
  const [o] = await repo.findUsersBasic([other]);
  return {
    items: items.map(mine(me)),
    nextCursor,
    other: o
      ? {
          id: String(o._id),
          name: o.name,
          avatarUrl: o.avatar?.url ?? null,
          publicId: o.publicId,
        }
      : null,
  };
}

export async function sendInThreadService(me, id, content) {
  const conv = await getOwn(me, id);
  const other = conv.members.map(String).find((m) => m !== String(me));
  const doc = await repo.createThreadMessage(conv, me, other, content);
  await repo.touchConversation(conv._id);
  return mine(me)({ ...doc.toObject(), sender: me });
}
