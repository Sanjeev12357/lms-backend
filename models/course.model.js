import {model,Schema} from "mongoose";
const courseSchema=new Schema({
    title:{
        type:String,
        required:[true,"title is required"],
        minLength:[8,'Title must be atleast 8 char'],
        maxLength:[60,'title must be less than 60n char'],
        trim:true,


    },
    description:{
        type:String,
        required:[true,"description  is required"],
        minLength:[8,'Description must be atleast 8 char'],
        maxLength:[120,'desc must be less than 60n char'],
    },
    category:{
        type:String,
        required:[true,"category is required"],
    },
    thumbnail:{
        public_id:{
            type:String,
            requried:true,
           
        },
        secure_url:{
            type:String,
            required:true,
        }
    },
    lectures:[
        {
            title:String,
            description:String,
            lecture:{
                public_id:{
                    type:String,
                    required:true,
                    
                },
                secure_url:{
                    type:String,
                    required:true,
                }
            }
        }
    ],
    numberOfLectures:{
        type:Number,
        default:0,
    },
    createdBy:{
        type:String,
        required:true,
    },
    
    

},{
    timestamps:true,
}
);

const Course=model('Course',courseSchema);

export default Course;