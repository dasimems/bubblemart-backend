import multer from "multer";
const imageStorage = multer.diskStorage({
  // Destination to store image
  destination: "files/images",
  filename: (_, file, cb) => {
    const fileExt = file.originalname.split(".").pop();
    const filename = `${file.fieldname}_${new Date().getTime()}.${fileExt}`;
    cb(null, filename);
  }
});

export const imageUpload = (limit: number = 2000000) =>
  multer({
    storage: imageStorage,
    limits: {
      fileSize: limit // defaults = 1 MB
    },
    fileFilter(_, file, cb) {
      if (!file.originalname.match(/\.(png|jpg)$/)) {
        return cb(new Error("Please upload a JPG or PNG Image"));
      }
      cb(null, true);
    }
  });
