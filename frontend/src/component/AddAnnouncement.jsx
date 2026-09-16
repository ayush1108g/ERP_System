import React, { useState, useContext } from "react";
import classes from "./AddAnnouncement.module.css"

import { useNavigate } from "react-router";
import axios from "axios";

import { backendUrl } from "../constant";
import LoginContext from "../store/context/loginContext";
import { useAlert } from "../store/context/Alert-context";
import { useSidebar } from "../store/context/sidebarcontext";

const Add_announcement = () => {
    const navigate = useNavigate();
    const alertCtx = useAlert();
    const Loginctx = useContext(LoginContext);
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const [announcement, setAnnouncement] = useState("");

    const addAnnouncement = async (e) => {
        e.preventDefault();
        if (announcement.trim().length === 0) {
            return alertCtx.showAlert("danger", "Fields cannot be empty");
        }
        try {
            const requestBody = {
                message: announcement
            };
            console.log(requestBody);
            const response = await axios.post(`${backendUrl}/api/v1/announcements`, requestBody, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}`, }, });
            console.log("Announcement Added successfully:", response.data);
            setAnnouncement("");
            alertCtx.showAlert("success", "Announcement Added Successfully");
            navigate('/');
        } catch (error) {
            console.error("Error adding Announcement:", error);
        }
    };

    return (<div style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <h3 className={classes.title}>Add Announcement</h3>
        <form className={classes.inputform}>
            <div className="mb-3">
                <label htmlFor="2" className="form-label">Write the announcement</label>
                <input type="text" className="form-control" id="2" aria-describedby="emailHelp" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" onClick={(e) => addAnnouncement(e)}>Submit</button>
        </form>
    </div>)
}


export default Add_announcement  