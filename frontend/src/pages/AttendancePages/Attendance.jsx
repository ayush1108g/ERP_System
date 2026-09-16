import React, { useState, useEffect, useContext } from "react";
import { PieChart } from 'react-minimal-pie-chart';
import { useCookies } from "react-cookie";
import axios from 'axios';

import { backendUrl } from "../../constant";
import { useAlert } from "../../store/context/Alert-context";
import LoginContext from "../../store/context/loginContext";
import { useSidebar } from "../../store/context/sidebarcontext";
import { MdDownload } from "react-icons/md";

// Haversine formula to calculate distance between two points on earth
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const lat1_r = lat1 * Math.PI / 180;
    const lon1_r = lon1 * Math.PI / 180;
    const lat2_r = lat2 * Math.PI / 180;
    const lon2_r = lon2 * Math.PI / 180;

    const dlat = lat2_r - lat1_r;
    const dlon = lon2_r - lon1_r;

    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1_r) * Math.cos(lat2_r) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
};

const Attendance = () => {
    const alertCtx = useAlert();
    const [cookie] = useCookies(["AccessToken", "RefreshToken"]);
    const loginCtx = useContext(LoginContext);
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const [courseData, setCourseData] = useState([]);
    const [load, setLoad] = useState(false);
    const [isActiveAttendance, setIsActiveAttendance] = useState([]);

    const courses = loginCtx?.user?.courses_enrolled;


    useEffect(() => {
        const fetchData = async () => {
            if (courses) {
                try {
                    console.log(loginCtx.AccessToken);
                    const resp = await Promise.all(courses.map(async (course) => {
                        const body = { course_id: course.course_id };
                        const response = await axios.post(backendUrl + '/api/v1/attendance/getbycourse', body, { headers: { Authorization: `Bearer ${cookie.AccessToken}` } });
                        console.log(response.data);
                        return response.data?.data?.attendance;
                    }));
                    console.log(resp);
                    const userid = loginCtx.user._id;

                    let datax = [];
                    resp.forEach((item, index) => {
                        let total = item.length;
                        let present = 0;
                        item?.forEach((ele) => {
                            const record = ele?.attendance_records;
                            let prnt = false;
                            record?.forEach((rec) => {
                                if (!prnt && rec?.student_id === userid) {
                                    present++;
                                    return prnt = true;
                                }
                            });
                        });
                        let absent = total - present;
                        const obj = { total, present, absent, course_id: courses[index].course_id };
                        datax.push(obj);
                    });

                    const promises = await datax.map(async (course) => {
                        const response = await axios.get(backendUrl + '/api/v1/courses/' + course.course_id, { headers: { Authorization: `Bearer ${cookie.AccessToken}` } });
                        return { ...course, course: response.data.data?.data[0] }
                    });

                    const results = await Promise.all(promises);
                    console.log(results);
                    setCourseData(results);
                } catch (err) {
                    // Handle error
                    console.error('Error fetching data:', err);
                    if (err?.response?.data?.message) {
                        return alertCtx.showAlert("danger", err.response.data.message);
                    }
                    alertCtx.showAlert("danger", "Error fetching data");
                }
            }
        };


        const fetchData1 = async () => {
            if (!courses) return;
            try {
                const promises = courses?.map(async (course) => {
                    const response = await axios.post(
                        backendUrl + '/api/v1/attendance/isActive', { course_id: course.course_id }, { headers: { Authorization: `Bearer ${cookie.AccessToken}` } });
                    return response?.data?.data;
                });
                const results = await Promise?.all(promises);
                setIsActiveAttendance(results);
            } catch (err) {
                if (err?.response?.data?.message) {
                    return alertCtx.showAlert("danger", err.response.data.message);
                }
                alertCtx.showAlert("danger", "Error fetching data");
            }
        };
        fetchData();
        fetchData1();
    }, [courses, load, loginCtx]);

    // Mark attendance function
    const handleMark = async (index) => {
        const attendanceid = isActiveAttendance[index]?.attendance?._id;
        const location = isActiveAttendance[index]?.attendance?.location;

        if (!navigator.geolocation) {
            console.log("Geolocation is not supported by your browser");
            alertCtx.showAlert("danger", "Geolocation is not supported by your browser");
            return;
        }

        // Check for geolocation permissions
        if (!navigator.permissions) {
            console.log("Permissions API not supported by browser");
            alertCtx.showAlert("danger", "Permissions API not supported by browser");
            return;
        }

        // Check geolocation permission state
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' });
        if (geoPermission.state === 'denied') {
            console.log("Please allow location permission");
            alertCtx.showAlert("danger", "Please allow location permission");
            return;
        }

        // Get current position
        navigator.geolocation.getCurrentPosition(async (position) => {
            // console.log(position.coords.latitude);
            // console.log(position.coords.longitude);
            // console.log(location.lat);
            // console.log(location.long);

            // Calculate distance
            const distance = haversine(position.coords.latitude, position.coords.longitude, location.lat, location.long);
            console.log(distance);

            // Check if distance exceeds threshold
            if (distance > 100) { // 100 m check
                console.log("You are not in the location");
                return alertCtx.showAlert("danger", "You are not in the location");
            }

            try {
                const body = { attendance_id: attendanceid, status: 'present' };

                // Mark attendance
                const response = await axios.post(
                    backendUrl + '/api/v1/attendance/mark', body, { headers: { Authorization: `Bearer ${loginCtx.AccessToken}` } });

                console.log(response.data);
                console.log("Attendance Marked");
                alertCtx.showAlert("success", "Attendance Marked");
            } catch (err) {
                console.error('Error marking attendance:', err);
                if (err?.response?.data?.message) {
                    return alertCtx.showAlert("danger", err.response.data.message);
                }
                alertCtx.showAlert("danger", "Error marking attendance");
            } finally {
                setLoad(!load);
            }
        });
    };

    const downloadAttendance = () => {
        const rows = [
            ["Course", "Total Classes", "Present", "Absent", "Attendance %"],
            ...courseData.map((item) => [
                item?.course?.name || "Course",
                item.total,
                item.present,
                item.absent,
                item.total === 0 ? 0 : ((item.present * 100) / item.total).toFixed(2)
            ])
        ];
        const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
        const blob = new Blob([`\uFEFF${csv}`], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "attendance-summary.xls";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: isSidebarOpen ? '210px' : '10px' }}>
            <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h1>Attendance</h1>
                <button className="btn btn-secondary" type="button" onClick={downloadAttendance} disabled={!courseData.length}>
                    <MdDownload /> Download Excel
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap' }}>
                {courseData.map((item, index) => {
                    return <div key={index}
                        style={{ width: '250px', height: '350px', padding: '10px', borderRadius: '10px', boxShadow: '2px 2px 5px 2px #888888', display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
                        <h3>{item?.course?.name}</h3>

                        <div style={{ maxWidth: '150px', maxHeight: '200px', }}>
                            <PieChart startAngle={-90} lengthAngle={-360} lineWidth={50} labelPosition={50}
                                label={({ dataEntry }) => {
                                    if (dataEntry.value === 0 || dataEntry.value === 0.1) { return null; }
                                    return `${dataEntry.title}: ${dataEntry.value}`
                                }}
                                labelStyle={{ fontSize: '8px', fontFamily: 'sans-serif', fill: '#121212', }}
                                data={[{ title: 'Present', value: item.present, color: '#D2DAFF' },
                                { title: 'Absent', value: item.total === 0 ? 0.1 : item.absent, color: '#B1B2FF' },]}
                            />
                        </div>

                        <p>Attendence Percent: {item.total === 0 ? 0 : (item.present * 100 / item.total).toFixed(2)}</p>

                        <hr style={{ width: '90%', color: 'black' }} />
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>

                            <p>{isActiveAttendance[index]?.isActive === false ? "Attendance not active yet" : "MARK ATTENDANCE"}</p>
                            {isActiveAttendance[index]?.isActive !== false && <button onClick={() => { handleMark(index) }}>MARK</button>}</div>
                    </div>
                })}
            </div>
        </div >
    )
}

export default Attendance;