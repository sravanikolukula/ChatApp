import React from "react";

const ContactCard = ({
  id,
  name,
  image,
  isOnline,
  unseenCount,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer transition-colors duration-200 max-sm:text-sm ${
        isSelected ? "bg-[#1E1E1E]" : ""
      } hover:bg-[#2E2E2E]`}
    >
      <img
        src={image}
        alt="icon"
        className=" w-[35px] aspect-[1/1]  rounded-full  object-cover"
      />
      {/* aspect-[1/1] meand width and height are equal */}
      <div className="flex  flex-col leading-5">
        <p>{name}</p>
        {isOnline !== undefined && (
          <span
            className={`text-xs ${
              isOnline ? "text-purple-300 " : "text-amber-500"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        )}
      </div>
      {unseenCount > 0 && (
        <p className=" absolute top-4 right-4 h-5 w-5 text-xs flex justify-center items-center rounded-full bg-[#9E8CFF] text-white">
          {unseenCount}
        </p>
      )}
    </div>
  );
};

export default ContactCard;
