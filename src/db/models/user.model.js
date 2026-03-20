import mongoose, { Schema, model } from "mongoose";
import { genderEnume, providerEnum, RoleEnum } from "../../common/enums/index.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [20, "First name must be at most 20 characters"],
      match: [/^[A-Za-z]+$/, "First name must contain only letters"]
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters"],
      maxlength: [20, "Last name must be at most 20 characters"],
      match: [/^[A-Za-z]+$/, "Last name must contain only letters"]
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Invalid email format"
      ]
    },

    password: {
      type: String,
      required: [
        function () {
          return this.provider == providerEnum.system;
        },
        "Password is required",
      ],
      minlength: [6, "Password must be at least 6 characters"],
      match: [
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&./]{6,}$/,
        "Password must contain letters and numbers"
      ]
    },

    phone: {
      type: String
    },

    gender: {
      type: Number,
      enum: Object.values(genderEnume),
      default: genderEnume.male
    },

    confirmEmail: {
      type: Boolean,
      default: false
    },

    changeCredentialTime: {
      type: Date
    },

    provider: {
      type: Number,
      enum: Object.values(providerEnum),
      default: providerEnum.system
    },

    role: {
      type: Number,
      enum: Object.values(RoleEnum),
      default: RoleEnum.User
    },

    image: {
      secure_url: String,
      public_id: String
    },

    coverPics: [
      {
        type: String
      }
    ],

    address: {
      country: String,
      city: String,
      street: String
    },

    isDeleted: {
      type: Boolean,
      default: false
    },
    emailOTP: {
      type: String
    },

    emailOTPExpire: {
      type: Date
    },

    profileImage: {
      type: String
    },



    profileViews: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],

    oldPassword:[String],

  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual("userName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

export const userModel =
  mongoose.models.User || model("User", userSchema);
