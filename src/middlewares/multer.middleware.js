import multer from "multer";

// Hum DiskStorage use karenge (File ko temporarily server ki hard disk par save karenge)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // File kahan save hogi? -> ./public/temp folder mein
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // File ka naam kya hoga?
    // Hum original naam hi rakhenge (e.g., shivam-photo.jpg)
    // Future mein hum isme Date.now() jod sakte hain taaki naam unique rahe
    cb(null, file.originalname);
  }
});

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Optional: Limit file size to 10MB
    }
});