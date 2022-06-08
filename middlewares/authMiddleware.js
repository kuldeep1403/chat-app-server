const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");

module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(
      token,
      "Success is not final, failure is not fatal: it is the courage to continue that counts",
      async (err, decodedToken) => {
        if (err) {
          res.json({ status: false });
          next();
        } else {
          const user = await User.findById(decodedToken.id);
          if (user) {
            res.json({ status: true, user, id: user._id });
          } else {
            res.json({ status: false });
            next();
          }
        }
      }
    );
  } else {
    res.json({ status: false });
    next();
  }
};
