import bcrypt from "bcryptjs";
import { genToken } from "../libs/utils.js";

import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/User.js";
import { io } from "../server.js";

//Signup a new user
export const signup = async (req, res) => {
  try {
    const { email, fullName, password, bio } = req.body;

    if (!fullName || !email || !password || !bio) {
      return res.json({ successLtrue, message: "Missing Details" });
    }

    //check if user alrady exists with the give email
    const existedUser = await User.findOne({ email });

    if (existedUser) {
      return res.json({ success: false, message: "User already exist" });
    }

    //Generate salt for hashed password
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    //creatae new user un the database
    const user = await User.create({
      fullName,
      password: hashedPassword,
      bio,
      email,
    });

    //Generate JWT token using user ID
    const token = genToken(user._id);

    res.json({
      success: true,
      user,
      token,
      message: "User created successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

//Controller to login a user

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    //Look for the user with given email
    const user = await User.findOne({ email });

    if (!user || !user.password) {
      return res.json({
        success: false,
        message: "Invalid Credentials.user not found",
      });
    }

    //compare the provided password with hashed password in DB
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.json({
        success: false,
        message: "Invalid Credentials.Wrong password",
      });
    }

    //Generate JWT token using user Id
    const token = genToken(user._id);

    res.json({
      success: true,
      user,
      token,
      message: "User Login successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//controller to check if user authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;

    const userId = req.user._id;

    let updatedUser;

    //if no new profilepic is provided,just update bio and name
    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      ); //Returns the updated document
    } else {
      //If profile pic is provided ,upload it to cloudinary
      const upload = await cloudinary.uploader.upload(profilePic);

      //update user's profilePic URL along with other details
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePic: upload.secure_url,
          bio,
          fullName,
        },
        { new: true }
      );
    }

    io.emit("profile-update", updatedUser);

    res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
