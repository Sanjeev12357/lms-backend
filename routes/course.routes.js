import {Router} from "express";
import { getAllCourses,getLecturesByCourseId,createCourse,addLectureToCourseById } from "../controllers/course.controllers.js";
import { authorizeRoles, isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router=Router();


router
.route('/')
.get(getAllCourses)
.post(
    isLoggedIn,
    authorizeRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse)


router.route('/:id')
        .get(isLoggedIn,getLecturesByCourseId)
        // .put(updateCourse,
        //     isLoggedIn,
        //     authorizeRoles('ADMIN'),)
        // .delete(
        //     isLoggedIn,
        //     authorizeRoles('ADMIN'),
        //     removeCourse)
            .post(
                isLoggedIn,
                authorizeRoles('ADMIN'),
                upload.single('lecture'),
                addLectureToCourseById
            );


export default router;