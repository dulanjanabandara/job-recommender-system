const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "A user must have a first name!"],
    maxlength: [25, "First name must have maximum 25 characters!"],
    minlength: [2, "A name must have at least 3 characters!"],
  },
  lastName: {
    type: String,
    required: [true, "A user must have a last name!"],
    maxlength: [25, "Last name must have maximum 25 characters!"],
    minlength: [2, "Last name must have at least 3 characters!"],
  },
  email: {
    type: String,
    required: [true, "A user must have an email address!"],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email!"],
  },
  phone: {
    type: String,
    required: [true, "A user must have a mobile phone number!"],
    maxlength: 10,
    minlength: 10,
    validate: [
      validator.isMobilePhone,
      "Please provide a mobile phone number!",
    ],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  role: {
    type: String,
    enum: ["user", "merchant", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    minlength: [8, "A password must contain at least 8 characters!"],
    select: false, // this will work when retrieving data. But when creating a new document, it still gives us the password field because it simply creates a document and not retrieving(filter/query/find) documents
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password!"],
    validate: {
      // This only works on CREATE and SAVE!!! Not going to work on UPDATE!!!
      validator: function (el) {
        // el is current element which is passwordConfirm
        return el === this.password;
      },
      message: "Passwords do not match!",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false, // removes the field in the query results from the schema level. Then, no need to filter when quering.
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; // this 1s deduction always ensures that token always is created after the password has been changed. This is not 100% accurate but this is a smart hack and it makes no issues!
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
