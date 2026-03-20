export const fileFaildValifation = {
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword'],
  video: ['video/mp4']
}
export const validationFileFilter = (validation = []) => {
  return function (req, file, cb) {

    if (!file) {
      return cb(new Error("no file uploaded", { cause: { status: 400 } }), false);
    }

    if (validation.length && !validation.includes(file.mimetype)) {
      return cb(
        new Error("invalid file format please try again", {
          cause: { status: 400 },
        }),
        false
      );
    }

    return cb(null, true);
  };
};
