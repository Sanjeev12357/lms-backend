import User from "../models/user.model.js";
import Razorpay from "razorpay";
export const getRazorpayApiKey=async(req,res)=>{
    res.status(200).json({
        success:true,
        message:"this is your razor pay api key",
        key:process.env.RAZORPAY_KEY_ID,
    })
};
export const buySubscription=async(req,res)=>{
    const {id}=req.user;
    const user=await User.findById(id);

    if(!user){
        return res.status(400).json({
            success:false,
            message:"unauthorized please look in",

        })
    }

    if(user.role=== 'ADMIN'){
        return res.status(400).json({
            success:false,
            message:"admin cannot purchase our subsccription",

        })
    }

    const subscription=await razorpay.subscriptions.create({
        plan_id:process.env.RAZORPAY_PLAN_ID,
      
    });

    user.subscription.id=subscription.id;
    user.subscription.status=subscription.status;

    await user.save();

    res.status(200).json({
        success:true,
        message:'subscribed successfully',
        subscription_id:subscription.id
    })

}

export const verifySubscription=async(req,res)=>{

}

export const cancelSubscription=async(req,res)=>{}
export const allPayments=async(req,res)=>{}