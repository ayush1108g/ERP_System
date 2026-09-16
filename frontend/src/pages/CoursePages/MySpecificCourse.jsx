import React, { useState, useEffect, useContext } from 'react'
import classes from './MySpecificCourse.module.css'

import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router";

import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useAlert } from '../../store/context/Alert-context';
import { useSidebar } from '../../store/context/sidebarcontext';

import image10 from '../../assets/10.jpg'
import image11 from '../../assets/11.jpg'
import image12 from '../../assets/12.jpg'

const MySpecificCourse = () => {
    const alertCtx = useAlert();
    const Loginctx = useContext(LoginContext);
    const navigate = useNavigate();
    const { courseId } = useParams();
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const [courseData, setCourseData] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    let isadmin = Loginctx.role === 'admin';

    useEffect(() => {
        // Fetch the course data from the backend
        const fetchdata = async () => {
            try {
                const response = await axios.get(backendUrl + '/api/v1/courses/' + courseId, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
                const courseInfo = response.data.data.data[0];
                setCourseData(courseInfo);
                setFeedback(courseInfo.feedback);
                setSchedule(courseInfo.schedule || []);
            } catch (err) {
                if (err?.response?.data?.message) {
                    return alertCtx.showAlert("danger", err.response.data.message);
                }
                console.log(err);
            }
        };
        fetchdata();
    }, [courseId]);

    // Function to navigate to the assignment page
    const assignmentPage = (courseId) => {
        navigate(`/my_courses/${courseId}/assignments`);
        console.log(courseId);
    }

    // Function to navigate to the feedback page
    const giveFeedback = (courseId) => {
        navigate(`/my_courses/${courseId}/feedback`);
    }

    // Function to navigate to the attendance page
    const attendanceHandler = () => {
        const role = Loginctx?.role;
        if (!role) {
            return navigate('/login');
        }
        if (role === 'student') {
            navigate('/attendance');
        } else {
            navigate(`/attendance/admin/${courseId}`);
        }
    }

    const canEditSchedule = Loginctx.role === 'admin'
        || (Loginctx.role === 'teacher' && (Loginctx.user?.courses_taught || []).some((course) => String(course?._id || course) === String(courseId)));

    const updateScheduleRow = (index, field, value) => {
        setSchedule((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
    };

    const saveSchedule = async () => {
        if (schedule.some((row) => !row.day || !row.time)) {
            return alertCtx.showAlert('danger', 'Complete every timetable row before saving');
        }
        setIsSavingSchedule(true);
        try {
            const response = await axios.patch(`${backendUrl}/api/v1/courses/${courseId}`, { schedule }, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
            setCourseData((current) => ({ ...current, schedule: response.data.data.data.schedule }));
            alertCtx.showAlert('success', 'Timetable updated successfully');
        } catch (err) {
            alertCtx.showAlert('danger', err?.response?.data?.message || 'Unable to update timetable');
        } finally {
            setIsSavingSchedule(false);
        }
    };

    return (<>
        {courseData && (<div style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
            <h1 className={classes.title}>{courseData.name}</h1>
            <div className={classes.gridContainer}>
                <div className={classes.gridItem}>
                    <div>Professor : </div>
                    <div className={classes.yoyo}>{courseData.professor.join(', ')}</div>
                </div>
                <div className={classes.gridItem}>
                    <div>Department : </div>
                    <div className={classes.yoyo}>{courseData.department.join(', ')}</div>
                </div>
                <div className={classes.gridItem}>
                    <div>Semester : </div>
                    <div className={classes.yoyo}>{courseData.semester.join(', ')}</div>
                </div>
                <div className={classes.gridItem}>
                    <div>Students Enrolled : </div>
                    <div className={classes.yoyo}>
                        {courseData.students_enrolled.length}
                    </div>
                </div>
            </div>
            {canEditSchedule && <section className={classes.scheduleEditor}>
                <div className={classes.scheduleHeader}>
                    <div><h2>Course timetable</h2><p>Update the class schedule for this course.</p></div>
                    <button type="button" className="btn btn-primary" onClick={saveSchedule} disabled={isSavingSchedule}>{isSavingSchedule ? 'Saving...' : 'Save timetable'}</button>
                </div>
                {schedule.map((row, index) => <div className={classes.scheduleRow} key={`${row.day}-${index}`}>
                    <select value={row.day || ''} onChange={(event) => updateScheduleRow(index, 'day', event.target.value)} aria-label={`Day ${index + 1}`}>
                        <option value="">Select day</option>
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <input type="time" value={row.time || ''} onChange={(event) => updateScheduleRow(index, 'time', event.target.value)} aria-label={`Time ${index + 1}`} />
                    <button type="button" className="btn btn-light" onClick={() => setSchedule((current) => current.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
                </div>)}
                <button type="button" className="btn btn-light" onClick={() => setSchedule((current) => [...current, { day: '', time: '' }])}>Add time slot</button>
            </section>}
            <div className={classes.b}>
                <div onClick={() => { assignmentPage(courseData._id) }} className={classes.a}>
                    <img src={image10} alt="" className={classes.img} />
                    <div className={classes.c}>
                        Assignments
                    </div>
                </div>
                <div className={classes.a}>
                    <img src={image11} alt="" className={classes.img} />
                    <div className={classes.c} onClick={attendanceHandler}>
                        Attendance
                    </div>
                </div>
                {!isadmin && <div onClick={() => { giveFeedback(courseData._id) }} className={classes.a}>
                    <img src={image12} alt="" className={classes.img} />
                    <div className={classes.c}>
                        FeedBack
                    </div>
                </div>
                }
            </div>
            {isadmin &&
                <><h1 className={classes.title}>FeedBacks</h1>
                    <div className={classes.gridContainer}>
                        {feedback.map((ele, ind) => { return (<div className={classes.gridItem}>Comments: {ele.comments}  ;  Ratings: {ele.rating}</div>); })}
                    </div>
                </>}
        </div>
        )}
    </>
    );
};

export default MySpecificCourse;
