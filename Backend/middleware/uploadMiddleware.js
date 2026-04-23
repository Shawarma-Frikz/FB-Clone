const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadProfileImages = (req, res, next) => {
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 }
  ])(req, res, (error) => {
    if (error) {
      const message = error.message || "File upload failed";
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      return res.status(statusCode).json({
        success: false,
        message
      });
    }

    next();
  });
};

const uploadPostMedia = (req, res, next) => {
  upload.array("media", 5)(req, res, (error) => {
    if (error) {
      const message = error.message || "File upload failed";
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      return res.status(statusCode).json({
        success: false,
        message
      });
    }

    next();
  });
};

const storyUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
      return cb(new Error("Only image and video uploads are allowed"));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

const uploadStoryMedia = (req, res, next) => {
  storyUpload.single("media")(req, res, (error) => {
    if (error) {
      const message = error.message || "File upload failed";
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      return res.status(statusCode).json({
        success: false,
        message
      });
    }

    next();
  });
};

const chatUpload = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, true),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

const uploadChatAttachment = (req, res, next) => {
  chatUpload.single("attachment")(req, res, (error) => {
    if (error) {
      const message = error.message || "File upload failed";
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      return res.status(statusCode).json({
        success: false,
        message
      });
    }

    next();
  });
};

module.exports = {
  uploadProfileImages,
  uploadPostMedia,
  uploadStoryMedia,
  uploadChatAttachment
};