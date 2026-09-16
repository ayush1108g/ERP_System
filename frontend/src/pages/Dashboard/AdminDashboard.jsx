import React, { useState, useEffect, useContext } from "react";
import classes from "./AdminDashboard.module.css";

import Navbar from "../../component/Navbar/Navbar"
import Modal from "../../component/Modal";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { PieChart } from 'react-minimal-pie-chart';
import { MdArrowBackIosNew } from "react-icons/md";
import { MdArrowForwardIos } from "react-icons/md";
import axios from "axios";

import { useAlert } from "../../store/context/Alert-context";
import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useSidebar } from "../../store/context/sidebarcontext";
import demoProfilePhoto from "../../assets/demo_profile_photo.png";
const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


const AdminDashBoard = () => {
    const [cookies] = useCookies(["AccessToken", "RefreshToken"]);
    const LoginCtx = useContext(LoginContext);
    const [todayTimetable, setTodayTimetable] = useState([]);
    const sidebarCtx = useSidebar();
    const isSidebarOpen = sidebarCtx.isSidebarOpen;
    const setIsSideBarOpen = sidebarCtx.toggleSidebar;
    const [announcement, setAnnouncement] = useState([]);
    const alertCtx = useAlert();
    const [courses, setCourses] = useState([]);
    const [modalisOpen, setModalisOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const navigate = useNavigate();
    const date = new Date();
    const today = date.getDay();

    const [erpstats, setErpstats] = useState([]);


    useEffect(() => {
        if (!LoginCtx.isLoginDataFetching && LoginCtx.role !== 'admin') {
            navigate('/');
        }
    }, [LoginCtx, navigate]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const resp = await axios.get(`${backendUrl}/api/v1/users/getalluserstats`, { headers: { Authorization: `Bearer ${cookies.AccessToken}`, }, });
                console.log(resp.data.data);
                setErpstats(resp.data.data);
            } catch (err) {
                console.log(err);
                if (err?.response?.data?.message) {
                    return alertCtx.showAlert("danger", err.response.data.message);
                }
                alertCtx.showAlert("danger", "Something went wrong");
            }
        }
        fetch();
    }, [LoginCtx])

    useEffect(() => {
        const asyncFunc1 = async () => {
            if (LoginCtx.user === null) {
                return;
            }
            let courseEnrolled;
            if (LoginCtx.role === "student") {
                courseEnrolled = LoginCtx.user?.courses_enrolled;
                courseEnrolled = courseEnrolled?.map((course) => {
                    return course.course_id;
                });
            } else if (LoginCtx.role === "teacher" || LoginCtx.role === "admin") {
                courseEnrolled = LoginCtx?.user?.courses_taught;
            }
            courseEnrolled = Array.from(new Set(courseEnrolled));

            let data = await Promise.all(
                courseEnrolled.map(async (course) => {
                    try {
                        const response = await axios.get(
                            `${backendUrl}/api/v1/courses/${course}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${cookies.AccessToken}`,
                                },
                            }
                        );
                        return response.data.data.data[0];
                    } catch (err) {

                        console.log(err);
                        if (err?.response?.data?.message) {
                            alertCtx.showAlert("danger", err.response.data.message);
                            return;
                        }
                        alertCtx.showAlert("danger", "Something went wrong");
                    }
                })
            );
            // console.log(data);
            data = Array.from(new Set(data));
            setCourses(data);
            let todayTimetable = data.map((course) => {
                let schedule = course?.schedule;
                schedule = Array.from(new Set(schedule));
                if (schedule?.length === 0) {
                    return null;
                }
                let ifToday = schedule?.map((obj) => {
                    if (obj.day === day[today]) {
                        return obj;
                    }
                    else
                        return null;
                })
                ifToday = ifToday.filter((obj) => obj !== null);

                // console.log(ifToday);
                if (ifToday.length !== 0) {
                    course.schedule = ifToday;
                    return course;
                }
                else
                    return null;
            });
            // console.log(todayTimetable);

            // remove null values from the array
            todayTimetable = todayTimetable.filter((course) => course !== null);
            console.log(todayTimetable);
            setTodayTimetable(Array.from(new Set(todayTimetable)));

        }
        asyncFunc1();
    }, [LoginCtx]);



    useEffect(() => {
        const asyncFunc = async () => {
            try {
                const resp = await axios.get(`${backendUrl}/api/v1/announcements`, {
                    headers: {
                        Authorization: `Bearer ${cookies.AccessToken}`,
                    },
                });
                // console.log(resp.data.announcements);
                const data = resp.data.announcements;
                data.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                }) // sort by date in descending order

                setAnnouncement(data);
            }
            catch (err) {
                console.log(err);
                if (err?.response?.data?.message) {
                    alertCtx.showAlert("danger", err.response.data.message);
                    return;
                }
            }
        }
        asyncFunc();
    }, []);

    // Function to handle the sidebar
    const handleSidebar = () => {
        setIsSideBarOpen(!isSidebarOpen);
    }

    // Function to handle the attendance
    const handleAttendance = () => {
        if (LoginCtx.role === 'student') {
            navigate('/attendance');
        }
        else {
            openModal("attendance");
        }
    }

    // Function to open the modal
    const openModal = (route) => {
        setModalData(route);
        setModalisOpen(true);
    };

    // Function to open the course page
    const openMyCoursesPage = () => {
        navigate('/my_courses');
    };

    // Function to close the modal
    const closeModal = () => {
        setModalisOpen(false);
        setModalData(null);
    }

    // Function to open the profile page
    const openProfilePage = () => {
        navigate('/profile');
    }

    // Function to open the add course page
    const openAddCourse = () => {
        navigate('/add_courses');
    }

    // Function to open the add announcement page
    const openAddAnnouncements = () => {
        navigate('/add_announcement');
    }

    // Function to open the add equipment page
    const openAddEquipment = () => {
        navigate('/add_inventory_item')
    }

    // Function to open the all courses page
    const openAllCourses = () => {
        navigate('/registration')
    }

    // Function to open the approve user page
    const openApproveUser = () => {
        navigate('/approve')
    }

    return (<>
        <Modal
            isOpen={modalisOpen}
            close={closeModal}
            courses={courses}
            data={modalData}
        />
        <div className={classes.body}        >
            <div style={{ width: isSidebarOpen ? '200px' : '20px' }} />
            <Navbar className={classes.navbar2}
                style={{ width: isSidebarOpen ? '200px' : '0px', display: isSidebarOpen ? 'block' : 'none' }}
                handleAttendance={handleAttendance} openModal={openModal}
            />
            <button type="button" className={classes.icon} aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"} title={isSidebarOpen ? "Collapse navigation" : "Expand navigation"} style={{ left: isSidebarOpen ? '203px' : '5px' }} onClick={handleSidebar}>
                {isSidebarOpen ? <MdArrowBackIosNew /> : <MdArrowForwardIos />}
            </button>
            <div className={classes.content} style={{ width: isSidebarOpen ? 'calc(100vw - 200px)' : 'calc(100vw - 20px)' }}            >
                <header className="header">
                    <div className="header-text">
                        <h1>Welcome,👋🏽</h1>
                    </div>
                    <div className="header-profile" onClick={openProfilePage}>
                        <p>{LoginCtx.role}</p>
                        <img src={LoginCtx?.user?.personal_info?.profile_picture || demoProfilePhoto} alt="profile_photo" onError={(event) => { event.currentTarget.src = demoProfilePhoto; }} />
                        <p>{LoginCtx.name}</p>
                    </div>
                </header>
                <h1 className={classes.title}>Admin Dashboard</h1>
                <div className={classes.grandParent}>
                    <div className={classes.parent}>

                        <div className={classes.recent}>
                            <h3 className={classes.recenttitle}>Recent Updates</h3>
                            <ul>
                                {
                                    announcement.map((item, index) => {
                                        return (
                                            <li key={index}>{item.time}
                                                <p>

                                                    {item.message}
                                                </p>
                                            </li>
                                        );
                                    })
                                }
                            </ul>
                        </div>
                        <div className={classes.box1}>
                            <div style={{ display: "flex", justifyContent: "center", }}                            >
                                <h3>Stats</h3>
                                <div style={{ maxWidth: "150px", maxHeight: "200px", }}                                >
                                    <PieChart startAngle={-90} lengthAngle={-360} lineWidth={50} labelPosition={50}
                                        label={({ dataEntry }) => { if (dataEntry?.value === 0 || isNaN(dataEntry.value)) { return null; } return `${dataEntry?.title}: ${dataEntry?.value}`; }}
                                        labelStyle={{ fontSize: "8px", fontFamily: "sans-serif", fill: "#121212", }}
                                        data={[{ title: erpstats[0]?._id, value: erpstats[0]?.numUsers, color: "#E1AFD1", },
                                        { title: erpstats[1]?._id, value: erpstats[1]?.numUsers, color: "#AD88C6", },
                                        { title: erpstats[2]?._id, value: erpstats[2]?.numUsers, color: "#7469B6", },]}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={classes.box1} onClick={() => openApproveUser()}>
                            Approve Users
                        </div>

                    </div>
                    <div className={classes.parent1}>
                        <div onClick={() => openAddCourse()}>
                            Add Courses
                        </div>
                        <div onClick={() => openAddAnnouncements()}>
                            Add Anouncements
                        </div>
                        <div onClick={() => openAddEquipment()}>
                            Add SAC Items
                        </div>
                        <div onClick={() => openAllCourses()}>
                            View All Courses
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </>

    )
}


export default AdminDashBoard 