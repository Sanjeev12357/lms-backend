import AppError from "../utils/error.util.js";
import User from "../models/user.model.js";
import cloudinary from 'cloudinary'
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";

const cookieOptions={
    maxAge:7*24*60*60*1000,
    httpOnly:true,
    secure:true,
}
const register=async(req,res,next)=>{
    const {fullName,email,password}=req.body;
    if(!fullName || !email ||!password){
        return next (new AppError('All fields are required',400));
    }

    const userExists= await User.findOne({email});
    if(userExists){
        return next(new AppError('Email already exists',400));
    }

    const user=await User.create({
        fullName,
        email,
        password,
        avatar:{
            public_id:email,
            secure_url:'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
        }

    });
    if(!user){
        return next(new AppError('User refgistration failed please try again',500));
    }
    const lms = 'lms';

    //TOD:file upload

    if(req.file){
        console.log(req.file);
        try{
            const result= await cloudinary.v2.uploader.upload(req.file.path,{
                folder:lms,
                width:250,
                height:250,
                gravity:'faces',
                crop:'fill',

            });

            if(result){
                user.avatar.public_id=result.public_id;
                user.avatar.secure_url=result.secure_url;

                //remove file from server
                fs.rm(`uploads/${req.file.filename}`)

            }
        }catch(error){
            return next(
                new AppError(error || ' file not uploaded please try again',500)
            );
        }
    }
    await user.save();

    user.password=undefined;

    const token=await user.generateJWTToken();

    res.cookie('token',token,cookieOptions);

    res.status(201).json({
        success:true,
        message:'User registered successfully',
        user,
    });



};

const login=async (req,res)=>{
    try{
        const {email,password}=req.body;

    if(!email|| !password){
        return NodeList(new AppError('all fields are required ',400));

    }
    const user=await User.findOne({
        email
    }).select('+password');

    if(!user ||  !user.comparePassword(password)){
        return next(new AppError('Email or password doesnot match',400));

    }

    const token=await user.generateJWTToken();
    user.password=undefined;

    res.cookie('token',token,cookieOptions);

    res.status(200).json({
        success:true,
        message:"user logged in successfully",
        user,
    })

    }catch(error){
        console.log(error);
    }
};

const logout=(req,res)=>{
    res.cookie('token',null,{
        secure:true,
        maxAge:0,
        httpOnly:true,
    });
    res.status(201).json({
        success:true,
        message:'User logged out successfully',
    })
};

const getProfile=async (req,res)=>{
    
    try{
        const userId=req.user.id;
    const user=await User.findById(userId);
    res.status(200).json({
        success:true,
        message:"user details",
        user,
    })
    }catch(error){
        return next(new AppError('failed to fetch user details',400));
    }
};

export const resetPassword = async (req, res, next) => {
    // Extracting resetToken from req.params object
    const { resetToken } = req.params;
  
    // Extracting password from req.body object
    const { password } = req.body;
  
    // We are again hashing the resetToken using sha256 since we have stored our resetToken in DB using the same algorithm
    const forgotPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
  
    // Check if password is not there then send response saying password is required
    if (!password) {
      return next(new AppError('Password is required', 400));
    }
  
    console.log(forgotPasswordToken);
  
    // Checking if token matches in DB and if it is still valid(Not expired)
    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() }, // $gt will help us check for greater than value, with this we can check if token is valid or expired
    });
  
    // If not found or expired send the response
    if (!user) {
      return next(
        new AppError('Token is invalid or expired, please try again', 400)
      );
    }
  
    // Update the password if token is valid and not expired
    user.password = password;
  
    // making forgotPassword* valus undefined in the DB
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
  
    // Saving the updated user values
    await user.save();
  
    // Sending the response when everything goes good
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  };
  

export const forgotPassword = async (req, res, next) => {
    // Extracting email from request body
    const { email } = req.body;
  
    // If no email send email required message
    if (!email) {
      return next(new AppError('Email is required', 400));
    }
  
    // Finding the user via email
    const user = await User.findOne({ email });
  
    // If no email found send the message email not found
    if (!user) {
      return next(new AppError('Email not registered', 400));
    }
  
    // Generating the reset token via the method we have in user model
    const resetToken = await user.generatePasswordResetToken();
  
    // Saving the forgotPassword* to DB
    await user.save();
  
    // constructing a url to send the correct data
    /**HERE
     * req.protocol will send if http or https
     * req.get('host') will get the hostname
     * the rest is the route that we will create to verify if token is correct or not
     */
    // const resetPasswordUrl = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/v1/user/reset/${resetToken}`;
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
    // We here need to send an email to the user with the token
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;
  
    try {
      await sendEmail(email, subject, message);
  
      // If email sent successfully send the success response
      res.status(200).json({
        success: true,
        message: `Reset password token has been sent to ${email} successfully`,
      });
    } catch (error) {
      // If some error happened we need to clear the forgotPassword* fields in our DB
      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpiry = undefined;
  
      await user.save();
  
      return next(
        new AppError(
          error.message || 'Something went wrong, please try again.',
          500
        )
      );
    }
  };


  export const changePassword = async (req, res, next) => {
    // Destructuring the necessary data from the req object
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user; // because of the middleware isLoggedIn
  
    // Check if the values are there or not
    if (!oldPassword || !newPassword) {
      return next(
        new AppError('Old password and new password are required', 400)
      );
    }
  
    // Finding the user by ID and selecting the password
    const user = await User.findById(id).select('+password');
  
    // If no user then throw an error message
    if (!user) {
      return next(new AppError('Invalid user id or user does not exist', 400));
    }
  
    // Check if the old password is correct
    const isPasswordValid = await user.comparePassword(oldPassword);
  
    // If the old password is not valid then throw an error message
    if (!isPasswordValid) {
      return next(new AppError('Invalid old password', 400));
    }
  
    // Setting the new password
    user.password = newPassword;
  
    // Save the data in DB
    await user.save();
  
    // Setting the password undefined so that it won't get sent in the response
    user.password = undefined;
  
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  };
  
  /**
   * @UPDATE_USER
   * @ROUTE @POST {{URL}}/api/v1/user/update/:id
   * @ACCESS Private (Logged in user only)
   */
  export const updateUser = async (req, res, next) => {
    // Destructuring the necessary data from the req object
    const { fullName } = req.body;
    const { id } = req.params;
  
    const user = await User.findById(id);
  
    if (!user) {
      return next(new AppError('Invalid user id or user does not exist'));
    }
  
    if (fullName) {
      user.fullName = fullName;
    }
  
    // Run only if user sends a file
    if (req.file) {
      // Deletes the old image uploaded by the user
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files in a folder named lms
          width: 250,
          height: 250,
          gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
          crop: 'fill',
        });
  
        // If success
        if (result) {
          // Set the public_id and secure_url in DB
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;
  
          // After successful upload remove the file from local storage
          fs.rm(`uploads/${req.file.filename}`);
        }
      } catch (error) {
        return next(
          new AppError(error || 'File not uploaded, please try again', 400)
        );
      }
    }
  
    // Save the user object
    await user.save();
  
    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
    });
  };
export{
    register,
    login,
    logout,
    getProfile,
    
    
}