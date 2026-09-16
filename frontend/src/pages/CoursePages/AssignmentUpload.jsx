import React, { useState, useRef, useContext } from "react";
import classes from "./AssignmentUpload.module.css"

import axios from "axios";
import { useParams } from "react-router-dom";
import { useAlert } from "../../store/context/Alert-context";

import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useSidebar } from "../../store/context/sidebarcontext";

const Assignment_upload = () => {
    const Loginctx = useContext(LoginContext);
    const datepickerRef = useRef('');
    const { courseId } = useParams();
    const alertCtx = useAlert();
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const [error, setError] = useState('');
    const [profile, setProfile] = useState(null);
    const [profileUrl, setProfileUrl] = useState("");
    const [fileuploading, setFileuploading] = useState(false);
    const [assignmentName, setAssignmentName] = useState("");
    const [assignmentDesc, setAssignmentDesc] = useState("");
    const [totalMarks, setTotalMarks] = useState(null);

    // Function to upload the file to the server and get the URL
    const uploadHandler = async () => {
        if (fileuploading) {
            return alert("File is uploading, please wait");
        }
        if (!profile) {
            return alert("Please select a file");
        }
        console.log('Selected file:', profile);

        const formData = new FormData();
        formData.append("file", profile);
        console.log(formData);
        setFileuploading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/v1/submitAssignment/upload-file`, formData, { headers: { "Content-Type": "multipart/form-data", }, });
            console.log(res);
            const id = res.data.data.id;
            const url = `https://drive.google.com/file/d/${id}/view?usp=sharing`;
            setProfileUrl(url);
            alertCtx.showAlert('success', 'File uploaded successfully');
        } catch (err) {
            console.log(err);
            if (err.response?.data?.message) {
                setError(err.response.data.message);
                return alertCtx.showAlert('error', err.response.data.message);
            }
            setError("Error uploading file");
        } finally {
            setFileuploading(false);
        }
    };

    // Function to add the assignment to the database 
    const addtAssignment = async (e) => {
        e.preventDefault();
        console.log("Hi from add assignment");
        const due_date = datepickerRef.current.value;
        if (!profileUrl) {
            return alert("Fail");
        }
        const body = {
            "courseId": courseId,
            "due_date": due_date,
            "description": assignmentDesc,
            "name": assignmentName,
            "total_marks": totalMarks,
            "questionFile": profileUrl
        }

        console.log("body", body);
        console.log("profileUrl", profileUrl);

        try {
            const response = await axios.post(backendUrl + '/api/v1/assignments', body, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}`, }, });
            console.log(response);
            alertCtx.showAlert("Assignment added successfully", "success");
        } catch (err) {
            console.log(err);
            if (err.response?.data?.message) {
                return alertCtx.showAlert("Error adding assignment", "error");
            }
            alertCtx.showAlert("Error adding assignment", "error");
        }
    }

    return (<div style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <h3 className={classes.title}>Upload the Assignment </h3>
        <form className={classes.inputform}>
            <div className="mb-3">
                <label htmlFor="1" className="form-label">Assignment Name</label>
                <input type="text" className="form-control" id="1" aria-describedby="emailHelp" value={assignmentName} onChange={(e) => setAssignmentName(e.target.value)} />
            </div>
            <div className="mb-3">
                <label htmlFor="2" className="form-label">Description</label>
                <input type="text" className="form-control" id="2" value={assignmentDesc} onChange={(e) => setAssignmentDesc(e.target.value)} />
            </div>
            <div className={`${classes.gridContainer} ${classes.Container2}`}>
                <label htmlFor="3" className="form-label">Question File</label>
                <div className={`${classes.gridItem} input-group mb-3`}>
                    <input type="file" className="form-control shadow-none " id="inputGroupFile02" onChange={(e) => setProfile(e.target.files[0])} />
                    <button type="button" className="input-group-text" onClick={uploadHandler}>
                        {fileuploading ? (<div className="spinner-border text-danger" role="status"> </div>) : 'Upload'}
                    </button>
                </div>
            </div>
            <div className={`${classes.gridItem} input-group mb-3`}>
                <span className="input-group-text" id="5">Due Date</span>
                <input ref={datepickerRef} type="date" className="form-control shadow-none "
                    placeholder="DD-MM-YYYY"
                    aria-label="01-01-2000" aria-describedby="5" />
            </div>
            <div className="mb-3">
                <label htmlFor="4" className="form-label">Total Marks</label>
                <input type="number" className="form-control" id="4" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" onClick={(e) => addtAssignment(e)}>Submit</button>
        </form>
    </div>)
}

export default Assignment_upload;