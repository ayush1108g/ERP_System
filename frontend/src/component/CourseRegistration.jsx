import React, { useState, useEffect, useContext } from "react";
import classes from "./CourseRegistration.module.css"

import { FaBookOpen } from "react-icons/fa";
import axios from 'axios';
import { useNavigate } from "react-router"

import { backendUrl } from "../constant";
import LoginContext from "../store/context/loginContext";
import { useAlert } from "../store/context/Alert-context";
import { useSidebar } from "../store/context/sidebarcontext";

import image1 from "../assets/1.jpg"
import image2 from "../assets/2.jpg"
import image3 from "../assets/3.jpg"
import image4 from "../assets/4.jpg"
import image0 from "../assets/0.jpg"

const linkarr = [image1, image2, image3, image4, image0]

const Courses_Registration = () => {
    const alertCtx = useAlert();
    const navigate = useNavigate();
    const Loginctx = useContext(LoginContext);
    const { isSidebarOpen } = useSidebar();


    const [courses, setCourses] = useState([]);
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState("student");

    useEffect(() => {
        // Fetch course data
        const fetchdata = async () => {
            try {
                const resp = await axios.get(backendUrl + '/api/v1/courses', { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
                console.log(resp.data);
                const allCourses = resp.data.data.data;
                setCourses(allCourses);
                return allCourses;
            } catch (err) {
                if (err?.response?.data?.message) {
                    return alertCtx.showAlert("danger", err.response.data.message);
                }
                console.log(err);
                alertCtx.showAlert("danger", "Error fetching data");
            }
        };
        fetchdata();
        if (Loginctx.role === "admin") {
            Promise.all([
                axios.get(backendUrl + "/api/v1/users/getall", { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } }),
                axios.get(backendUrl + "/api/v1/registration-requests", { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } }),
            ]).then(([usersResponse, requestsResponse]) => {
                setUsers(usersResponse.data.data || []);
                setRequests(requestsResponse.data.data || []);
            }).catch((err) => alertCtx.showAlert("danger", err?.response?.data?.message || "Unable to load registration data"));
        } else {
            axios.get(backendUrl + "/api/v1/registration-requests/mine", { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } })
                .then((response) => setRequests(response.data.data || []))
                .catch((err) => alertCtx.showAlert("danger", err?.response?.data?.message || "Unable to load requests"));
        }
    }, [Loginctx.role, Loginctx.AccessToken]);

    // Function to register for a course
    const registerCourseHandler = async (courseId) => {
        try {
            if (isCourseRegistered(courseId)) {
                return alertCtx.showAlert("success", "You are already registered for this course");
            }
            if (Loginctx.role === "admin") {
                if (!selectedUser) return alertCtx.showAlert("danger", "Select a user first");
                await axios.post(backendUrl + "/api/v1/registration-requests/direct", { courseId, userId: selectedUser, requestedRole: selectedRole }, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
                alertCtx.showAlert("success", "User registered successfully");
                return;
            }
            await axios.post(backendUrl + "/api/v1/registration-requests/request", { courseId }, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
            alertCtx.showAlert("success", "Registration request sent for admin approval");
            const response = await axios.get(backendUrl + "/api/v1/registration-requests/mine", { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
            setRequests(response.data.data || []);
        } catch (error) {
            if (error?.response?.data?.message) {
                alertCtx.showAlert("danger", error.response.data.message);
            } else {
                console.error('Error registering for the course:', error);
                alertCtx.showAlert("danger", "Error registering for the course");
            }
        }
    };

    const reviewRequest = async (id, status) => {
        try {
            await axios.patch(backendUrl + `/api/v1/registration-requests/${id}/review`, { status }, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
            setRequests((current) => current.filter((request) => request._id !== id));
            alertCtx.showAlert("success", `Request ${status}`);
        } catch (error) {
            alertCtx.showAlert("danger", error?.response?.data?.message || "Unable to review request");
        }
    };

    const pendingForCourse = (courseId) => Loginctx.role === "admin"
        ? null
        : requests.find((request) => request.course?._id === courseId && request.status === "pending");
    const isCourseRegistered = (courseId) => {
        const id = String(courseId);
        if (Loginctx.role === "student") {
            return (Loginctx.user?.courses_enrolled || []).some((course) => String(course?.course_id?._id || course?.course_id) === id);
        }
        if (Loginctx.role === "teacher") {
            return (Loginctx.user?.courses_taught || []).some((course) => String(course?._id || course) === id);
        }
        return false;
    };
    const eligibleUsers = users.filter((user) => user.role === selectedRole);

    return (<div className={classes.Body} style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <h1 className={classes.title}><FaBookOpen color="Purple" /> &nbsp; Registration</h1>
        {Loginctx.role === "admin" && requests.length > 0 && <section className={classes.requests}>
            <h2>Pending requests</h2>
            {requests.map((request) => <div className={classes.requestRow} key={request._id}>
                <div><strong>{request.targetUser?.personal_info?.name}</strong><span>{request.requestedRole} · {request.course?.name}</span></div>
                <div className={classes.requestActions}><button className="btn btn-primary" onClick={() => reviewRequest(request._id, "approved")}>Approve</button><button className="btn btn-light" onClick={() => reviewRequest(request._id, "rejected")}>Reject</button></div>
            </div>)}
        </section>}
        {Loginctx.role === "admin" ? <section className={classes.adminPanel}>
            <h2>Admin registration</h2>
            <p>Register an approved student or teacher directly into a course.</p>
            <div className={classes.adminControls}>
                <select value={selectedRole} onChange={(event) => { setSelectedRole(event.target.value); setSelectedUser(""); }}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>
                <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
                    <option value="">Select user</option>
                    {eligibleUsers.map((user) => <option key={user._id} value={user._id}>{user.personal_info?.name} ({user.email})</option>)}
                </select>
            </div>
        </section> : <section className={classes.requestNotice}>
            Course registrations require admin approval. You can submit one request per course.
        </section>}
        <div className={classes.eqp}>
            <ul className={classes.list}>
                {courses.map((ele, ind) => {
                    const registered = isCourseRegistered(ele._id);
                    const pending = pendingForCourse(ele._id);
                    return (<li key={ind} className={classes.listitem}                    >
                        <img src={linkarr[ind % 5]} alt="" style={{ minHeight: '150px' }} />
                        <div className={classes.details} >
                            <h4 className={classes.courceName}>{ele.name}</h4>
                            <p className={classes.profName}>{ele.professor[0]}</p>
                        </div>
                        <div className={classes.listfooter}>
                            <div className={classes.icons}>
                                <button className={`${classes.btn} ${registered ? classes.registered : ""}`} disabled={registered || Boolean(pending)} onClick={() => registerCourseHandler(ele._id)}>{registered ? "Registered" : pending ? "Pending approval" : Loginctx.role === "admin" ? "Register user" : "Request registration"}</button>
                            </div>
                        </div>
                    </li>)
                })}
            </ul>
        </div>
    </div>)
}

export default Courses_Registration;