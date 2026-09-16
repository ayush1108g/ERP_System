import React, { useState, useEffect, useContext } from 'react'
import classes from './ViewAttendance.module.css'
import { GiCheckMark } from "react-icons/gi";
import { RxCross2 } from "react-icons/rx";
import { useParams } from 'react-router';
import axios from 'axios';

import { backendUrl } from "../../constant";
import LoginContext from '../../store/context/loginContext';
import { useAlert } from '../../store/context/Alert-context';
import { useSidebar } from '../../store/context/sidebarcontext';
import { MdDownload } from "react-icons/md";

const View_attendance = () => {
    const Alertctx = useAlert();
    const Loginctx = useContext(LoginContext);
    const { courseId } = useParams();
    const { isSidebarOpen } = useSidebar();

    const [courseData, setCourseData] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [names, setNames] = useState([]);

    useEffect(() => {
        // Fetch course data
        const fetchdata = async () => {
            if (!courseId) { return; }
            try {
                const response = await axios.get(backendUrl + '/api/v1/courses/' + courseId, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
                setCourseData(response.data.data.data[0]);
            } catch (err) {
                if (err?.response?.data?.message) {
                    return Alertctx.showAlert("danger", err.response.data.message);
                }
                Alertctx.showAlert("danger", "Error Fetching Data");
            }
        };

        // Fetch attendance data
        const fetchdata2 = async () => {
            if (!courseId) {
                return;
            }
            try {
                const response = await axios.post(backendUrl + '/api/v1/attendance/getbycourse', { course_id: courseId }, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
                const data = response.data.data?.attendance;
                let attendance = [];
                data.forEach((ele) => {
                    let date = ele.date.split('T')[0];
                    let record = ele.attendance_records;
                    record.forEach((element) => { attendance.push({ ...element, date: date }) })
                });

                setAttendanceData(attendance);
                let nameObj = attendance.reduce((obj, ele) => {
                    obj[ele.student_id] = obj[ele.student_id] || ele?.name || ele?.rollNumber || null;
                    return obj;
                }, {});
                setNames(nameObj);

            } catch (err) {
                if (err?.response?.data?.message) {
                    return Alertctx.showAlert("danger", err.response.data.message);
                }
                Alertctx.showAlert("danger", "Error Fetching Data");
            }
        };
        fetchdata();
        fetchdata2();
    }, [courseId, Loginctx.AccessToken]);

    const uniqueDates = Array.from(new Set(attendanceData?.map(item => item.date)));
    const uniqueNames = Array.from(new Set(attendanceData?.map(item => item.student_id)));

    const downloadAttendance = () => {
        const rows = [
            ["Student", ...uniqueDates],
            ...uniqueNames.map((studentId) => [
                names[studentId] || studentId,
                ...uniqueDates.map((date) => attendanceData.some((item) => item.student_id === studentId && item.date === date) ? "Present" : "Absent")
            ])
        ];
        const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([`\uFEFF${csv}`], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${courseData?.name || "attendance"}-attendance.xls`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const tableHeaderCells = uniqueDates.map(date => (<th key={date}>{date}</th>));

    // Generate table rows for names
    const tableRows = uniqueNames.map(rollNumber => (
        <tr key={rollNumber}>
            <td style={{ position: 'sticky', left: '0vw', backgroundColor: 'white' }}>{names[rollNumber] ? names[rollNumber] : rollNumber}</td>
            {uniqueDates.map(date => (
                <td key={date} className={attendanceData?.some(item => item.student_id === rollNumber && item.date === date) ? 'present' : ''}>{attendanceData?.some(item => item.student_id === rollNumber && item.date === date) ? <GiCheckMark color='blue' /> : <RxCross2 color='red' size={10} />}</td>
            ))}
        </tr>
    ));

    // Create attendance handler
    const createAttendanceHandler = async () => {
        const course_id = courseId;
        let location = { lat: 0, long: 0 };

        try {
            const locationPermission = await navigator.permissions.query({ name: 'geolocation' });
            if (locationPermission.state === 'denied') {
                console.log(locationPermission.state);
                return Alertctx.showAlert("danger", "Please enable location services");
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            location = await { lat: position.coords.latitude, long: position.coords.longitude };
            console.log(location);

            if (location.lat === 0 && location.long === 0) {
                Alertctx.showAlert("danger", "Please fix location services");
                return;
            }

            console.log(location);
            const response = await axios.post(backendUrl + '/api/v1/attendance/createAttendence', { course_id: course_id, location: location }, {
                headers: { Authorization: `Bearer ${Loginctx.AccessToken}` }
            });
            console.log(response);
            Alertctx.showAlert("success", "Attendance Created Successfully");
        } catch (err) {
            if (err?.response?.data?.message) {
                return Alertctx.showAlert("danger", err.response.data.message);
            }
            Alertctx.showAlert("danger", "Error Creating Attendance");
        }
    };


    return (<>
        <div style={{ maxWidth: '100vw', marginLeft: isSidebarOpen ? '210px' : '10px' }}>
            <h1 className={classes.title}>Attendance Report</h1>

            <div className={classes.gridContainer}>
                <div className={classes.gridItem}>
                    <div>Course : </div>
                    <div className={classes.yoyo}>{courseData?.name}</div>
                </div>
                <div className={classes.gridItem}>
                    <div>Export Report : </div>
                    <button className="btn btn-secondary" type="button" onClick={downloadAttendance} disabled={!attendanceData.length}>
                        <MdDownload /> Download Excel
                    </button>
                </div>
                <div className={classes.gridItem}>
                    <div>Faculty : </div>
                    <div className={classes.yoyo}>{courseData?.professor.join(', ')}</div>
                </div>
                <div className={classes.gridItem}>
                    <div>Semester : </div>
                    <div className={classes.yoyo}>{courseData?.semester.join(', ')}</div>
                </div>

                <div className={classes.gridItem}>
                    <div>Students Enrolled : </div>
                    <div className={classes.yoyo}>{courseData?.students_enrolled.length}</div>
                </div>

                <div className={classes.gridItem}>
                    <div>Create Attendance : </div>
                    <button className="btn btn-primary"
                        onClick={createAttendanceHandler}
                    >Start Attendance</button>
                </div>
            </div>

            <div className={classes.attendanceGrid}>
                {<table>
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', left: '0vw', backgroundColor: 'white' }}>RollNumber</th>
                            {tableHeaderCells}
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>}
            </div>
        </div>
    </>)
}

export default View_attendance;