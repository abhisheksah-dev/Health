let cloudinary = null;
try { cloudinary = require('cloudinary'); } catch (e) { console.warn("cloudinary module not installed, using stub functions."); }

// (Optional) Configure cloudinary if env vars are set (e.g. CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
if (cloudinary && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn("Cloudinary configuration not found. Using stub functions.");
}

// Stub (or fallback) upload function. (If cloudinary is configured, it uses cloudinary.v2.uploader.upload; otherwise, it returns a dummy url.)
exports.uploadFile = async (file, folder) => {
  if (cloudinary && cloudinary.v2.config.cloud_name) {
    const res = await cloudinary.v2.uploader.upload(file, { folder });
    return { url: res.secure_url, public_id: res.public_id };
  } else {
    console.log("Stub uploadFile called (cloudinary not configured)");
    return { url: "https://stub.cloudinary.com/" + folder + "/" + (file.split("/").pop() || "stub"), public_id: "stub" };
  }
};

// Stub (or fallback) delete function. (If cloudinary is configured, it uses cloudinary.v2.uploader.destroy; otherwise, it logs a stub message.)
exports.deleteFile = async (public_id) => {
  if (cloudinary && cloudinary.v2.config.cloud_name) {
    const res = await cloudinary.v2.uploader.destroy(public_id);
    return res;
  } else {
    console.log("Stub deleteFile called (cloudinary not configured) for public_id: " + public_id);
    return { result: "ok" };
  }
}; 