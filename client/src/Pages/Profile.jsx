import React, { useLayoutEffect, useState } from "react";
import assets from "../assets/assets";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";
import toast from "react-hot-toast";

const Profile = () => {
  const location = useLocation();
  const isGroupProfile = location.pathname.includes("group-profile");

  const { authUser, updateProfile } = useAuthContext();
  const { selectedGroup, updateGroup } = useChatContext();

  const [selectedImg, setSelectedImg] = useState(null);

  const [name, setName] = useState(
    isGroupProfile ? selectedGroup?.name : authUser?.fullName
  );
  const [bio, setBio] = useState(
    isGroupProfile ? selectedGroup?.bio : authUser?.bio
  );
  const navigate = useNavigate();

  const onsubmitHandler = async (e) => {
    e.preventDefault();

    const updateData = {
      ...(isGroupProfile ? { name } : { fullName: name }),
      bio,
    };

    const processUpdate = async (data) => {
      if (isGroupProfile) {
        await updateGroup(selectedGroup._id, data);
      } else {
        await updateProfile(data);
      }
      navigate("/");
    };

    if (!selectedImg) {
      await processUpdate(updateData);
      return;
    }

    const reader = new FileReader(); //creating object for FileReader
    reader.readAsDataURL(selectedImg); // asking to  converting selectedImg to base64

    reader.onload = async () => {
      //Executes after image is loaded succesfully
      const base64Img = reader.result;
      await processUpdate({ ...updateData, profilePic: base64Img });
      return;
    };
    reader.onerror = (error) => {
      console.error("File reading error:", error);
      toast.error("File reading error:", error);
    };
  };

  const displayImg = selectedImg
    ? URL.createObjectURL(selectedImg)
    : isGroupProfile
    ? selectedGroup?.profilePic || assets.groupIcon
    : authUser?.profilePic || assets.avatar_icon;

  return (
    <div className="min-h-screen bg-cover bg-no-repeat  flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={onsubmitHandler}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-lg">
            {isGroupProfile ? "Group details" : "Profile details"}
          </h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="file"
              id="avatar"
              accept=".jpg, .png,.jpeg"
              onChange={(e) => setSelectedImg(e.target.files[0])}
              hidden
            />
            <img
              src={displayImg}
              alt="profile"
              className={`w-12 h-12 ${selectedImg && "rounded-full"}`}
            />
            Upload {isGroupProfile ? "group" : "profile"} image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder={isGroupProfile ? "Group name" : "Your name"}
            className="p-2 border-2 border-gray-500  rounded-md focus:outline-none focus:ring-2 focus:ring-white-500 "
            required
          />
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={`Write ${isGroupProfile ? "group" : "profile"} bio`}
            className="p-2 border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-white-500"
            required
          ></textarea>

          <button
            type="submit"
            className="p-2 bg-gradient-to-r
            from-[#9E8CFF] to-gray-200 text-black hover:shadow-[0_0_10px_2px_rgba(255,255,255,0.4)]
            rounded-full text-lg cursor-pointer"
          >
            Save
          </button>
        </form>
        <img
          src={displayImg}
          className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10  ${
            selectedImg && "rounded-full"
          }`}
        />
      </div>
    </div>
  );
};

export default Profile;
