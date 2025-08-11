import React from "react";

const MessageInfoModel = ({ message, members, onClose }) => {
  members = message.membersAtSendTime;
  const seenUserIds = (message.seenBy || []).filter(Boolean);

  const senderId = message.sender_id._id;

  const seenUsers = members.filter(
    (u) =>
      seenUserIds.includes(u._id) && u._id.toString() !== senderId.toString()
  );

  const notSeenUsers = members.filter(
    (u) =>
      !seenUserIds.includes(u._id) && u._id.toString() !== senderId.toString()
  );

  return (
    <div className="fixed inset-0 bg-gray bg-opacity-60 flex justify-center items-center z-50">
      <div
        className="bg-white rounded-xl p-6 w-[300px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-2">Message Info</h2>

        {/* Message preview */}
        {message.text ? (
          <p className="text-gray-700 mb-4">{message.text}</p>
        ) : message.image ? (
          <img src={message.image} alt="sent-img" className="mb-4 rounded-lg" />
        ) : (
          <p className="text-gray-400 mb-4">No content</p>
        )}

        {/* Seen by */}
        <div className="mb-3">
          <p className="font-medium text-sm text-green-600">Seen By:</p>
          {seenUsers.length > 0 ? (
            seenUsers.map((user) => (
              <p key={user._id} className="text-sm text-gray-600">
                {user.fullName}
              </p>
            ))
          ) : (
            <p className="text-sm text-gray-500">No one has seen this yet</p>
          )}
        </div>

        {/* Delivered to */}
        <div>
          <p className="font-medium text-sm text-yellow-600">Delivered To:</p>
          {notSeenUsers.length > 0 ? (
            notSeenUsers.map((user) => (
              <p key={user._id} className="text-sm text-gray-600">
                {user.fullName}
              </p>
            ))
          ) : (
            <p className="text-xs text-gray-400">Seen by all</p>
          )}
        </div>
        <button
          onClick={() => {
            onClose();
          }}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-full text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MessageInfoModel;
