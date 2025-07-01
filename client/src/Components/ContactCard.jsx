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
      className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ${
        isSelected ? "bg-[#282142]/50" : ""
      } hover:bg-[#282142]`}
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
              isOnline ? "text-green-500 " : "text-amber-500"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        )}
      </div>
      {unseenCount > 0 && (
        <p className=" absolute top-4 right-4 h-5 w-5 text-xs flex justify-center items-center rounded-full bg-violet-500/50">
          {unseenCount}
        </p>
      )}
    </div>
  );
};

export default ContactCard;
