import React, { useState, useContext } from 'react';
import LoginContext from '../store/context/loginContext';
// import { useCookies } from "react-cookie";
// import { backendUrl } from '../constant';
// import axios from 'axios';
import { useNavigate } from "react-router"
import { useAlert } from '../store/context/Alert-context';

const ModalA = (props) => {
    console.log(props);
    const alertCtx = useAlert();
    const loginCtx = useContext(LoginContext);
    const userData = loginCtx.user;
    const courses = props.courses;
    const [selectedCourse, setSelectedCourse] = useState(null);
    const navigate = useNavigate();

    const outsideClickHandler = (event) => {
        console.log("outside click");
        props.close(false);

    }
    const insideClickHandler = (event) => {
        event.stopPropagation();
        console.log("inside click");
    }

    const submitHandler = () => {
        console.log(selectedCourse);
        if (selectedCourse === "Select Course" || selectedCourse === null) {
            alertCtx.showAlert("danger", "Select any course");
            return;
        }
        if (props.data === "feedback") {
            props.close(false);
            navigate(`/my_courses/${selectedCourse}/feedback`);
        }
        else if (props.data === "attendance") {
            props.close(false);
            navigate(`/attendance/admin/${selectedCourse}`);
        } else if (props.data === "assignment") {
            props.close(false);
            navigate(`/my_courses/${selectedCourse}/assignments`);
        }
    }

    return (
        props.isOpen && (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}
                onClick={outsideClickHandler}
            >
                <div
                    style={{
                        width: "300px",
                        height: "300px",
                        backgroundColor: "white",
                        borderRadius: "10px",
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: "10px",
                    }}
                    onClick={insideClickHandler}
                >
                    <h3>{props.data.charAt(0).toUpperCase() + props.data.slice(1)} for</h3>
                    <div className={` input-group mb-3`}>
                        <span class="input-group-text" id="9">Course</span>
                        <select class="form-control shadow-none" aria-label="Large select example"
                            value={selectedCourse}
                            onChange={(e) => { setSelectedCourse(e.target.value) }}
                        >
                            <option selected value={null}>Select Course </option>
                            {courses.map((course) => {
                                if (!course) return null;
                                return (
                                    <option value={course._id}>{course.name}</option>
                                )
                            })}
                        </select>
                    </div>

                    {/* Bootstrap button */}
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                        flexDirection: "row"
                    }}>

                        <button
                            type="button"
                            class="btn btn-primary"
                            onClick={() => props.close(false)}
                        >Close</button>
                        <button
                            type="button"
                            class="btn btn-primary"
                            onClick={() => submitHandler()}
                        >Submit</button>
                    </div>

                </div>

            </div>
        )
    );
};

export default ModalA;
