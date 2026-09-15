import React, { useContext, useEffect, useState } from "react";
import "./HomePage.css";
import { PieChart } from "react-minimal-pie-chart";
import { useCookies } from "react-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import axios from "axios";

import LoginContext from "../../store/context/loginContext";
import Modal from "../../component/Modal";
import Navbar from "../../component/Navbar/Navbar";
import { backendUrl } from "../../constant";
import { useAlert } from "../../store/context/Alert-context";
import classes from './AdminDashboard.module.css';
import { useSidebar } from "../../store/context/sidebarcontext";
const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cookies] = useCookies(["AccessToken", "RefreshToken"]);
  const alertCtx = useAlert();
  const LoginCtx = useContext(LoginContext);

  const [courses, setCourses] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [announcement, setAnnouncement] = useState([]);
  const [modalisOpen, setModalisOpen] = useState(false);
  // const [isSidebarOpen, setIsSideBarOpen] = useState(true);
  const isSidebarOpen = useSidebar().isSidebarOpen;
  const setIsSideBarOpen = useSidebar().toggleSidebar;
  const [todayTimetable, setTodayTimetable] = useState([]);
  const [Attendance, setAttendance] = useState({ total: 0, present: 0, absent: 0 });

  const date = new Date(); // get current date
  const today = date.getDay(); // get current day

  // redirect to admin page if role is admin
  useEffect(() => {
    if (LoginCtx.role === 'admin' && location.pathname !== '/admin') {
      navigate('/admin');
    }
  }, [LoginCtx.role, location.pathname, navigate,]);


  // get courses and timetable
  useEffect(() => {
    const asyncFunc1 = async () => {

      // if user is not logged in return
      if (LoginCtx.user === null) {
        return;
      }
      let courseEnrolled;
      if (LoginCtx.role === "student") {
        courseEnrolled = LoginCtx.user?.courses_enrolled;
        courseEnrolled = courseEnrolled?.map((course) => {
          return course.course_id;
        });
      }
      else if (LoginCtx.role === "teacher") {
        courseEnrolled = LoginCtx?.user?.courses_taught;
      }
      courseEnrolled = Array.from(new Set(courseEnrolled));

      let data = await Promise.all(courseEnrolled.map(async (course) => {
        try {
          const response = await axios.get(`${backendUrl}/api/v1/courses/${course}`, { headers: { Authorization: `Bearer ${cookies.AccessToken}`, }, });
          return response.data.data.data[0];
        } catch (err) {
          if (err?.response?.data?.message) {
            alertCtx.showAlert("danger", err.response.data.message);
            return;
          }
          alertCtx.showAlert("danger", "Something went wrong");
        }
      }));

      data = Array.from(new Set(data));

      setCourses(data);
      let todayTimetable = data.map((course) => {
        let schedule = course?.schedule;
        schedule = Array.from(new Set(schedule));

        // if schedule is empty return null
        if (schedule?.length === 0) {
          return null;
        }

        // if today's schedule is not present return null
        let ifToday = schedule?.map((obj) => {
          if (obj.day === day[today]) {
            return obj;
          } else return null;
        });
        ifToday = ifToday.filter((obj) => obj !== null);

        if (ifToday.length !== 0) {
          course.schedule = ifToday;
          return course;
        } else return null;
      });

      // remove null values from the array
      todayTimetable = todayTimetable.filter((course) => course !== null);
      console.log(todayTimetable);
      setTodayTimetable(Array.from(new Set(todayTimetable)));
    };

    asyncFunc1();
  }, [LoginCtx.isLoggedIn]);

  // get announcements
  useEffect(() => {
    const asyncFunc = async () => {
      try {
        const resp = await axios.get(`${backendUrl}/api/v1/announcements`, { headers: { Authorization: `Bearer ${cookies.AccessToken}` } });
        console.log(resp.data.announcements);
        const data = resp.data.announcements;
        data.sort((a, b) => { return new Date(b.date) - new Date(a.date); }); // sort by date in descending order
        setAnnouncement(data);
      } catch (err) {
        console.log(err);
        if (err?.response?.data?.message) {
          return alertCtx.showAlert("danger", err.response.data.message);
        }
      }
    };
    asyncFunc();
  }, [LoginCtx.isLoggedIn]);

  // get attendance
  useEffect(() => {
    const asyncFunc = async () => {
      if (LoginCtx.role === "student") {
        try {
          const resp = await axios.get(`${backendUrl}/api/v1/attendance/getpercent`, { headers: { Authorization: `Bearer ${cookies.AccessToken}` } });
          console.log(resp);
          const data = resp.data.data;
          const att = {
            total: data.totalA,
            present: data.presentA,
            absent: data.totalA - data.presentA,
          };
          console.log(att);
          setAttendance(att);
        } catch (err) {
          console.log(err);
          if (err?.response?.data?.message) {
            return alertCtx.showAlert("danger", err.response.data.message);
          }
        }
      }
    };
    asyncFunc();
  }, [LoginCtx.isLoggedIn]);

  // navigate to attendance according to role
  const handleAttendance = () => {
    if (LoginCtx.role === "student") {
      navigate("/attendance");
    } else {
      openModal("attendance");
    }
  };

  // open modal
  const openModal = (route) => {
    setModalData(route);
    setModalisOpen(true);
  };
  // close modal
  const closeModal = () => {
    setModalisOpen(false);
    setModalData(null);
  };

  // open my courses page
  const openMyCoursesPage = () => {
    navigate("/my_courses");
  };

  // open profile page
  const openProfilePage = () => {
    navigate("/profile");
  };

  // handle sidebar open and close
  const handleSidebar = () => {
    setIsSideBarOpen(!isSidebarOpen);
  }
  return (
    <>
      <Modal isOpen={modalisOpen} close={closeModal} courses={courses} data={modalData} />
      <div>
        <div>

          <div className={classes.navbar} style={{ width: isSidebarOpen ? '200px' : '20px' }}>
            <Navbar className={classes.navbar2} style={{ width: isSidebarOpen ? '200px' : '0px', display: isSidebarOpen ? 'block' : 'none' }}
              handleAttendance={handleAttendance} openModal={openModal} />
            <div className={classes.icon} style={{ left: isSidebarOpen ? '203px' : '5px', zIndex: 10 }} onClick={handleSidebar} >
              {!isSidebarOpen ? <>
                <MdArrowForwardIos style={{ boxShadow: "0 0 10px #00ff00" }} />
                <MdArrowForwardIos style={{ boxShadow: "0 0 10px #00ff00" }} />
              </> : <MdArrowBackIosNew />}
            </div>
          </div>

          <div className="maincontainer">
            <main className="main">
              <div className="container" style={{ left: isSidebarOpen ? '200px' : '0px', }} >
                <header className="header">
                  <div className="header-text">
                    <h1>Welcome,👋🏽</h1>
                  </div>
                  <div className="header-profile" onClick={openProfilePage}>
                    <p>{LoginCtx.role}</p>
                    <img src={LoginCtx?.user?.personal_info?.profile_picture} alt="profile_photo" />
                    <p>{LoginCtx.name}</p>
                  </div>
                </header>

                <section className="today-timetable">
                  <h2>Today's Timetable</h2>
                  <div className="items">
                    {todayTimetable.map((course, index) => {
                      if (course === null) { return null; }
                      return (
                        <div className="timetable-card" key={index}>
                          <div className="time">{course.schedule[0].time}</div>
                          <div className="subject">{course.name}</div>
                          <div className="topic-name">
                            {course.professor[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <main className="main">

                  <section className="materiais">
                    <h2>Materials</h2>
                    <div className="materiais-grid">
                      <div className="materiais-card" onClick={openMyCoursesPage} >
                        <h3>Courses</h3>
                        <p>This Semester</p>
                      </div>
                      <div className="materiais-card" onClick={() => handleAttendance()} >
                        <h3>Attendance</h3>
                        {LoginCtx?.role === "student" && <p>
                          This Semester: &nbsp;
                          {Attendance.total === 0 ? 0 : (Attendance.present / Attendance.total) * 100}{" "} % </p>}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }} >
                          <div style={{ maxWidth: "150px", maxHeight: "200px" }}
                          >
                            {<PieChart startAngle={-90} lengthAngle={-360} lineWidth={50} labelPosition={50}
                              label={({ dataEntry }) => { if (dataEntry.value === 0 || isNaN(dataEntry)) { return null; } return `${dataEntry.title}: ${dataEntry.value}`; }}
                              labelStyle={{ fontSize: "8px", fontFamily: "sans-serif", fill: "#121212", }}
                              data={[{ title: "Present", value: Attendance.present, color: "#D2DAFF", }, { title: "Absent", value: Attendance.absent, color: "#B1B2FF", },]} />}
                          </div>
                        </div>
                        {LoginCtx?.role === "student" && <p>Total : {Attendance.total}</p>}
                      </div>

                      <div className="materiais-card" onClick={() => openModal("assignment")} >
                        <h3>Assignment</h3>
                        <p>This Semester</p>
                      </div>

                      <div className="materiais-card" onClick={() => openModal("feedback")} >
                        <h3>Feedback</h3>
                        <p></p>
                      </div>
                    </div>
                  </section>

                  <section className="update">
                    <h2>Recent Updates</h2>
                    <div className="update-items">
                      {announcement.map((item, index) => {
                        return (
                          <li key={index}>
                            {item.time}
                            <p>{item.message}</p>
                          </li>
                        );
                      })}
                    </div>
                  </section>

                </main>
              </div>
            </main>
          </div>

        </div>
      </div>
    </>
  );
}

export default HomePage;
