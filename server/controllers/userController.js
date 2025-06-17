import bcrypt from "bcryptjs";
import { genToken } from "../libs/utils.js";

import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/User.js";

//Signup a new user
export const signup = async (req, res) => {
  try {
    const { email, fullName, password, bio } = req.body;

    if (!fullName || !email || !password || !bio) {
      return res.json({ successLtrue, message: "Missing Details" });
    }

    const existedUser = await User.findOne({ email });

    if (existedUser) {
      return res.json({ success: false, message: "User already exist" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      password: hashedPassword,
      bio,
      email,
    });

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

    const user = await User.findOne({ email });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

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
    if (!profilePic) {
      await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);
      await User.findByIdAndUpdate(
        userId,
        {
          profilePic: upload.secure_url,
          bio,
          fullName,
        },
        { new: true }
      );
    }
    res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
