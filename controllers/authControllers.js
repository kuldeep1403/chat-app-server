const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const handleErrors = (err) => {
  let errors = { email: "", password: "", username: "", name: "", image: "" };

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
        if (user) {
          res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            token: generateToken(user._id),
          });
        }
      }
    }
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, created: false });
  }
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    const user = await UserModel.login(email, password);
    console.log(user.username);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        token: generateToken(user._id),
      });
    }
  } catch (err) {
    console.log(err);
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
};
