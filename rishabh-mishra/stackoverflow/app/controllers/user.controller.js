const { body, validationResult } = require("express-validator");
const { createToken, verifyPassword } = require("../utils/authentication");
const User = require("../models").users;

// Signup
exports.createUser = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).json({ errors: result.array() });
  }

  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(422).json({
        errors: [{ msg: "Email already exists, Try Login instead" }],
      });
    }

    const user = await new User({
      name,
      email,
      password,
    });
    user.isNew = true;
    user.save();
    const token = createToken(user);

    return res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: [{ msg: err.message }] });
  }
};

exports.signin = async (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(422).json({ errors: result.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(422).json({
        errors: [{ msg: "Invalid Credentials" }],
      });
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(422).json({
        errors: [{ msg: "Invalid Credentials" }],
      });
    }

    const token = createToken(user);

    return res.status(201).json({
      user,
      token,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: [{ msg: err.message }] });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    return res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: [{ msg: err.message }] });
  }
};

// Validate Singin
exports.validateSignin = [
  body("email")
    .exists()
    .trim()
    .withMessage("is required")

    .notEmpty()
    .withMessage("cannot be blank")

    .isEmail()
    .withMessage("must be a valid email address"),

  body("password")
    .exists()
    .trim()
    .withMessage("is required")

    .notEmpty()
    .withMessage("cannot be blank")

    .isLength({ min: 6 })
    .withMessage("must be at least 6 characters long")

    .isLength({ max: 50 })
    .withMessage("must be at most 50 characters long"),
];

// Validate user
exports.validateUser = [
  body("name")
    .exists()
    .trim()
    .withMessage("is required")

    .notEmpty()
    .withMessage("cannot be blank"),
  ...this.validateSignin,
];