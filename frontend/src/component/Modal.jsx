import React, { useState, useContext } from 'react';
import LoginContext from '../store/context/loginContext';
// import { useCookies } from "react-cookie";
// import { backendUrl } from '../constant';
// import axios from 'axios';
import { useNavigate } from "react-router"
import { useAlert } from '../store/context/Alert-context';
import './Modal.css';

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
            <div className="modal-backdrop"
                onClick={outsideClickHandler}
            >
                <div className="erp-modal"
                    onClick={insideClickHandler}
                >
                    <div className="erp-modal-header"><div><span className="eyebrow">Choose a course</span><h3>{props.data.charAt(0).toUpperCase() + props.data.slice(1)} for</h3></div><button type="button" className="modal-close" onClick={() => props.close(false)} aria-label="Close">&times;</button></div>
                    <div className="input-group mb-3">
                        <span className="input-group-text" id="9">Course</span>
                        <select className="form-control shadow-none" aria-label="Large select example"
                            value={selectedCourse}
                            onChange={(e) => { setSelectedCourse(e.target.value) }}
                        >
                            <option value={null}>Select Course </option>
                            {courses.map((course) => {
                                if (!course) return null;
                                return (
                                    <option key={course._id} value={course._id}>{course.name}</option>
                                )
                            })}
                        </select>
                    </div>

                    {/* Bootstrap button */}
                    <div className="erp-modal-actions">

                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => props.close(false)}
                        >Close</button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => submitHandler()}
                        >Submit</button>
                    </div>

                </div>

            </div>
        )
    );
};

export default ModalA;
