import { Message } from "./../model/message.model.js";
export const saveMessageInDb = async (content, receiver, sender) => {
  // console.log("content", content);
  // console.log("receiver", receiver);
  // console.log("sender", sender);

  return Message.create({
    content: content,
    receiver: receiver,
    sender: sender,
  });
};

export const getAllMessagesByUserId = async (userId) => {
  return Message.find(
    {
      receiver: userId,
    },
    {},
    {
      populate: { path: "sender" , select: -"password" },
    },
  );
};
