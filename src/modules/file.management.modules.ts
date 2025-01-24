import fs from "fs";
export const removeFile = (path: string) => {
  fs.access(path, (err) => {
    if (!err) {
      fs.unlinkSync(path);
    }
  });
};
