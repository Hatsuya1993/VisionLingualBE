const AppError = require("./errorController");

exports.translate = (req, res, next) => {

  return res.json({ message: "Translate API" });

  // restaurant
  //   .save()
  //   .then((restaurant) => {
  //     return res.json(restaurant);
  //   })
  //   .catch((err) => {
  //     return AppError.onError(res, "restaurant add error" + err);
  //   });
};