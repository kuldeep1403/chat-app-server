const { register, login } = require("../controllers/authControllers");
const { checkUser } = require("../middlewares/authMiddleware");

const router = require("express").Router();

router.post("/users",checkUser);
router.post("/api/register", register);
router.post("/api/login", login);

module.exports = router;
