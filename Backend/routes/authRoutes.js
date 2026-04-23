const express = require("express");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully",
    data: {
      user: req.user
    }
  });
});

module.exports = router;
