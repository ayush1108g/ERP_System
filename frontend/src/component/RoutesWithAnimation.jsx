import React, { useContext, useEffect } from "react";

import { Route, Routes, useLocation, useNavigate, } from "react-router-dom";
import { useCookies } from "react-cookie";
import { verifyToken, refreshAccessToken } from "../store/utils/auth";
import { backendUrl } from "../constant";
import axios from "axios";
import LoginContext from "../store/context/loginContext";

import SignupPage from "../pages/SignupPage";
import LoginPage from "../pages/LoginPage";
import ForgotPassPage from "../pages/ForgotPass/ForgotPassPage";
import ForgotPassIDPage from "../pages/ForgotPass/ForgotPassIDPage";
import ForgotPassConfirmPage from "../pages/ForgotPass/ForgotPassConfirmPage";
import Errorpage from "../pages/Errorpage";
import HomePage from "../pages/Dashboard/HomePage";

import Attendance from "../pages/AttendancePages/Attendance";
import ProfilePage from "./ProfilePage";
import AddCourses from "../pages/CoursePages/Add_courses";
import AddAnnouncement from "./AddAnnouncement";
import AdminDashBoard from "../pages/Dashboard/AdminDashboard";
import ApproveUser from "./ApproveUser";
import AddInventoryItem from "../pages/SACInventoryPages/AddInventoryItem";
import UpdateInventoryItem from "../pages/SACInventoryPages/UpdateInventoryItem";
import FeedbackForm from "./FeedbackForm";

import InventoryForm from "../pages/SACInventoryPages/InventoryForm";
import InventoryPage from "../pages/SACInventoryPages/InventoryPage";

import MyCourses from "../pages/CoursePages/MyCourses";
import MySpecificCourse from "../pages/CoursePages/MySpecificCourse";
import SpecificCourseAssignments from "../pages/CoursePages/SpecificCourseAssignments";
import SpecificAssignment from "../pages/CoursePages/SpecificAssignment";
import AssignmentUpload from "../pages/CoursePages/AssignmentUpload";

import AttendanceAdmin from "../pages/AttendancePages/ViewAttendance";
import CourseRegistration from "./CourseRegistration";

// All Routes with animation and token verification
const RoutesWithAnimation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const authCtx = useContext(LoginContext);
    const [cookie] = useCookies(["AccessToken", "RefreshToken"]);
    const isPublicRoute = location.pathname === "/login"
        || location.pathname === "/signup"
        || location.pathname.startsWith("/login/forgotpassword");
    // Verify the token and set the user data in the context
    useEffect(() => {
        const asyncFunc = async (AccessToken) => {
            const accessToken = typeof AccessToken === "string" && AccessToken.split(".").length === 3
                ? AccessToken
                : null;
            const refreshToken = typeof cookie.RefreshToken === "string" && cookie.RefreshToken.split(".").length === 3
                ? cookie.RefreshToken
                : null;
            if (!accessToken) {
                if (AccessToken || cookie.RefreshToken) authCtx.logout();
                authCtx.setIsLoggedIn(false);
                authCtx.setLoading(false);
                authCtx.setIsLoginDataFetching(false);
                return;
            }
            try {
                const response = await verifyToken(accessToken);
                if (response?.isLoggedin === true) {
                    authCtx.setAccessToken(accessToken);
                    authCtx.setRefreshToken(refreshToken);
                    authCtx.setIsLoggedIn(true);
                    authCtx.setName(response?.name);
                } else if (response?.expired && refreshToken) {
                    await refreshAccessToken(asyncFunc, authCtx, refreshToken);
                } else {
                    authCtx.logout();
                }
            } catch (err) {
                authCtx.logout();
            } finally {
                authCtx.setLoading(false);
                authCtx.setIsLoginDataFetching(false);
            }
        };
        asyncFunc(cookie.AccessToken);
    }, [cookie.AccessToken, cookie.RefreshToken]);

    // Redirect to login page if not logged in
    useEffect(() => {
        // setTimeout(() => {
        if (!authCtx.isLoginDataFetching && authCtx.isLoggedIn === false && !isPublicRoute) {
            navigate("/login");
        }
        // }, 1000);
    }, [authCtx.isLoggedIn, authCtx.isLoginDataFetching, isPublicRoute, navigate]);

    // Update the user data in the context
    useEffect(() => {
        const asyncFunc0 = async () => {
            if (authCtx.isLoggedIn && !authCtx.isLoginDataFetching && !authCtx.user && cookie.AccessToken) {
                try {
                    const resp = await axios.get(`${backendUrl}/api/v1/users/update`, { headers: { Authorization: `Bearer ${cookie.AccessToken}` }, });
                    console.log(resp.data.data);
                    authCtx.setUser(resp.data.data);
                    console.log(resp);
                } catch (err) {
                    console.log(err);
                }
            }
        };
        asyncFunc0();
    }, [authCtx.isLoggedIn, authCtx.isLoginDataFetching, authCtx.user, cookie.AccessToken]);

    return (<Routes location={location} key={location.key}>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/forgotpassword" element={<ForgotPassPage />} />
        <Route path="/login/forgotpassword/:id" element={<ForgotPassIDPage />} />
        <Route path="/login/forgotpassword/:id/confirm" element={<ForgotPassConfirmPage />} />
        <Route path="/login/forgotpassword/:id" element={<ForgotPassIDPage />} />
        <Route path="/login/forgotpassword/:id/confirm" element={<ForgotPassConfirmPage />} />

        <Route path="/my_courses" element={<MyCourses />} />
        <Route path="/my_courses/:courseId" element={<MySpecificCourse />} />
        <Route path="/my_courses/:courseId/feedback" element={<FeedbackForm />} />
        <Route path="/my_courses/:courseId/assignments" element={<SpecificCourseAssignments />} />
        <Route path="/my_courses/:courseId/assignments/:assignmentId" element={<SpecificAssignment />} />
        <Route path="/:courseId/assignment_upload" element={<AssignmentUpload />} />

        <Route path="/registration" element={<CourseRegistration />} />
        <Route path="/inventory/:equipmentId" element={<InventoryForm />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/attendance/admin/:courseId" element={<AttendanceAdmin />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/feedback" element={<FeedbackForm />} />

        {authCtx.role === "admin" && (
            <>
                <Route path="/add_inventory_item" element={<AddInventoryItem />} />
                <Route path="/approve" element={<ApproveUser />} />
                <Route path="/add_courses" element={<AddCourses />} />
                <Route path="/add_announcement" element={<AddAnnouncement />} />
                <Route path="/:equipmentId/update_inventory_item" element={<UpdateInventoryItem />} />
            </>
        )}

        <Route path="/admin" element={<AdminDashBoard />} />
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Errorpage />} />
    </Routes>);
};

export default RoutesWithAnimation;