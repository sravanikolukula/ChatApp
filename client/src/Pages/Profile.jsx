import React, { useState } from "react";
import assets from "../assets/assets";
import { unstable_RouterContextProvider, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const Profile = () => {
  const { authUser, updateProfile } = useAuthContext();

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);
  const navigate = useNavigate();

  const onsubmitHandler = async (e) => {
    e.preventDefault();

    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Img = reader.result;
      await updateProfile({ profilePic: base64Img, fullName: name, bio });
      navigate("/");
      return;
    };
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat  flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg">
        <form
          onSubmit={onsubmitHandler}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-lg">Profile details</h3>
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
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : assets.avatar_icon
              }
              alt="profiel"
              className={`w-12 h-12 ${selectedImg && "rounded-full"}`}
            />
            Upload profile image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            placeholder="Your name"
            className="p-2 border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write profile bio"
            className="p-2 border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            required
          ></textarea>

          <button
            type="submit"
            className="p-2 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-full text-lg cursor-pointer"
          >
            Save
          </button>
        </form>
        <img
          src={authUser?.profilePic || assets.logo_icon}
          className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10  ${
            selectedImg && "rounded-full"
          }`}
        />
      </div>
    </div>
  );
};

export default Profile;
