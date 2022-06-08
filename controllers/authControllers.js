const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const expire = 3 * 24 * 60 * 60; //3 days
const createToken = (id) => {
  return jwt.sign(
    { id },
    "Success is not final, failure is not fatal: it is the courage to continue that counts",
    {
      expiresIn: expire,
    }
  );
};

const handleErrors = (err) => {
  let errors = { email: "", password: "", username: "", name: "",image:"" };

  if (err.message === "incorrect Email") {
    errors.email = "Email is not registered";
  }

  if (err.message === "incorrect Password") {
    errors.password = "Password is incorrect";
  }

  if (err.code === 11000 && err.keyPattern.email === 1) {
    errors.email = "Email is already registered";
  }
  if (err.code === 11000 && err.keyPattern.username === 1) {
    errors.username = "Username is already taken";
  }

  if (err.message.includes("Users validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

module.exports.register = async (req, res) => {
  const { name, username, email, password, image } = req.body;
  try {
    if (image) {
      const uploadedResponse = await cloudinary.uploader.upload(image, {
        upload_preset: "chatAppProfilePic",
      });
      if (uploadedResponse) {
        const user = await UserModel.create({
          name,
          username,
          email,
          password,
          image: uploadedResponse,
        });
        const token = createToken(user._id);
        res.cookie("jwt", token, {
          withCredentials: true,
          httpOnly: false,
          expire: expire * 1000,
        });
        res.status(201).json({
          user: user._id,
          created: true,
        });
      }
    }
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, created: false });
  }
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: false, expire: expire * 1000 });
    res.status(200).json({ user: user._id, status: true });
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
};
