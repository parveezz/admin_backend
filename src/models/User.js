const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    emailAddress: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'admin',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    profileImage: {
      type: String,
      default: "",
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [String],
      select: false,
    },
    resetPasswordOTP: String,
    resetPasswordOTPExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset OTP (6 digits)
UserSchema.methods.getResetPasswordOTP = function () {
  // Generate random 6 digit numeric code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and set to resetPasswordOTP field
  this.resetPasswordOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expire to 10 minutes from now
  this.resetPasswordOTPExpire = Date.now() + 10 * 60 * 1000;

  return otp;
};

module.exports = mongoose.model('User', UserSchema);
