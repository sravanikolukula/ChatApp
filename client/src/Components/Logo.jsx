import React, { useEffect } from "react";
import assets from "../assets/assets";

const Logo = ({ text }) => {
  // const textSize =
  //   {
  //     sm: "text-sm",
  //     base: "text-base",
  //     lg: "text-lg",
  //     xl: "text-xl",
  //     "2xl": "text-2xl",
  //     "3xl": "text-3xl",
  //     "4xl": "text-4xl",
  //     "5xl": "text-5xl",
  //     "6xl": "text-6xl",
  //   }[text] || "text-5xl";
  const textSize = text ? text : "text-5xl"; // default size

  return (
    <div className="flex items-center gap-1">
      <h1 className={`${textSize} font-bold text-white`}>Talk</h1>
      <h1
        className={`${textSize} font-bold bg-gradient-to-r from-[#9E8CFF] to-[#CFC8FF] bg-clip-text text-transparent`}
      >
        ify
      </h1>
    </div>
  );
};

export default Logo;
