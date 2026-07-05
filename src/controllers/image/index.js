const { getImages } = require('./getImages');
const { moderateImage } = require('./moderateImage');
const { deleteImage } = require('./deleteImage');
const { uploadImage } = require('./uploadImage');

module.exports = {
  getImages,
  moderateImage,
  deleteImage,
  uploadImage,
};
