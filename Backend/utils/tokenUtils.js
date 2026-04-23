const jwt = require("jsonwebtoken");

const getJwtConfig = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured");
  }

  return {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
  };
};

const createTokenPayload = (user) => ({
  id: user._id.toString(),
  tokenVersion: user.tokenVersion || 0
});

const generateAccessToken = (user) => {
  const { accessSecret, accessExpiresIn } = getJwtConfig();
  return jwt.sign(createTokenPayload(user), accessSecret, { expiresIn: accessExpiresIn });
};

const generateRefreshToken = (user) => {
  const { refreshSecret, refreshExpiresIn } = getJwtConfig();
  return jwt.sign(createTokenPayload(user), refreshSecret, { expiresIn: refreshExpiresIn });
};

const verifyAccessToken = (token) => {
  const { accessSecret } = getJwtConfig();
  return jwt.verify(token, accessSecret);
};

const verifyRefreshToken = (token) => {
  const { refreshSecret } = getJwtConfig();
  return jwt.verify(token, refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
