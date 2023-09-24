import { Schema, model } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken"; // Fix the import here
import crypto from 'crypto';

const userSchema = new Schema({
  fullName: {
    type: String, // Fix the type declaration
    required: [true, 'Name is required'],
    minLength: [5, 'Name must be at least 5 characters'],
    maxLength: [50, "Name must be less than 50 characters"],
    lowercase: true,
    trim: true,
  },
  email: {
    type: String, // Fix the type declaration
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    unique: true,
    match: [
      // Email validation regex
      /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/,
      "Please fill in a valid email address",
    ],
  },
  password: {
    type: String, // Fix the type declaration
    required: [true, "Password is required"],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
    },
    secure_url: {
      type: String, // Fix the type declaration
    }
  },
  role: {
    type: String, // Fix the type declaration
    enum: ['USER', 'ADMIN'],
    default:'ADMIN'
  },
  forgotPasswordToken: String,
  forgotPasswordExpiry: Date,
  subscription:{
    id:String,
    status:String,
  }
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods = {
  generateJWTToken: async function () {
    return await jwt.sign(
      {
        id: this._id,
        email: this.email,
        subscription: this.subscription, // You might want to define 'subscription' in your schema
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY,
      }
    );
  },
  comparePassword:async function(plainTexPassword){
    return await bcrypt.compare(plainTexPassword,this.password);
  },
  generatePasswordResetToken:async function(){
    const resetToken=crypto.randomBytes(20).toString('hex');

    this.forgotPasswordToken=crypto.createHash('sha256')
                                    .update(resetToken)
                                    .digest('hex');
    this.forgotPasswordExpiry=Date.now()+15*60*1000;//15 min form now
  }

};

const User = model('User', userSchema);
export default User;
