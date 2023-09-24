
import app from "./app.js";
import connectionDB from "./configs/dbConnection.js";
import cloudinary from 'cloudinary';
import Razorpay from "razorpay";
const PORT=process.env.PORT || 4000;
cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
});

export const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET,
})

app.listen(PORT,async()=>{
    await connectionDB();
    console.log(`app is running at https:localhost:${PORT}`);
})