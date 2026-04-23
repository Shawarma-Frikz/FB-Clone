const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const uploadImageFromBuffer = (file, folder = "fb-social/profiles") =>
  new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Image file is required"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });

const uploadMediaFromBuffer = (file, folder = "fb-social/stories", resourceType = "auto") =>
  new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Media file is required"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });

module.exports = {
  cloudinary,
  uploadImageFromBuffer,
  uploadMediaFromBuffer
};