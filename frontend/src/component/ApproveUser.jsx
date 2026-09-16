import React, { useState, useEffect, useContext } from "react";
import classes from "../pages/CoursePages/MyCourses.module.css"
import { FaBookOpen } from "react-icons/fa";
import axios from 'axios';

import { backendUrl } from "../constant";
import LoginContext from "../store/context/loginContext";
import { useSidebar } from "../store/context/sidebarcontext";

import image1 from "../assets/1.jpg"
import image2 from "../assets/2.jpg"
import image3 from "../assets/3.jpg"
import image4 from "../assets/4.jpg"
import image0 from "../assets/0.jpg"
import { useAlert } from "../store/context/Alert-context";

const linkarr = [image1, image2, image3, image4, image0]

const ApproveUser = () => {
    const alertCtx = useAlert();
    const Loginctx = useContext(LoginContext);
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const [data, setData] = useState([]);
    const [message, setMessage] = useState('Loading...');
    const [approve, setapprove] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const resp = await axios.get(backendUrl + "/api/v1/users/tobeapproved", { headers: { Authorization: `Bearer ${Loginctx?.AccessToken}`, }, })
                console.log(resp);
                setData(resp.data.data);
                setMessage('');
            } catch (err) {
                console.log(err);
                if (err?.response?.data?.message) {
                    return alertCtx.showAlert("danger", err.response.data.message);
                }
                alertCtx.showAlert("danger", "Something went wrong");
            }
        }
        fetch();
    }, [Loginctx, approve]);

    const approveHandler = async (id) => {
        try {
            const resp = await axios.get(backendUrl + "/api/v1/users/approve/" + id, { headers: { Authorization: `Bearer ${Loginctx?.AccessToken}`, }, })
            setapprove(!approve);
            alertCtx.showAlert("success", "approved");
        } catch (err) {
            console.log(err);
            if (err?.response?.data?.message) {
                return alertCtx.showAlert("danger", err.response.data.message);
            }
            alertCtx.showAlert("danger", "Something went wrong");
        }
    }

    return (<div className={classes.Body} style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <h1 className={classes.title}><FaBookOpen color="Purple" /> &nbsp; Approve Users</h1>
        <p>{message}</p>
        <div className={classes.eqp}>
            <ul className={classes.list}>
                {data.map((ele, ind) => {
                    return (<li key={ind}
                        className={classes.listitem}
                    >
                        <img src={ele?.personal_info?.profile_picture} alt="" style={{ minHeight: '120px' }} />
                        <div className={classes.details1} >
                            <p className={classes.courceName}>{ele?.personal_info?.name}</p>
                            <p className={classes.profName}>{ele?.role}</p>
                            <p className={classes.profName}>{ele?.email}</p>
                            <p className={classes.profName}>{ele?.phoneNumber}</p>
                        </div>
                        <div className={classes.listfooter}>
                            <div className={classes.icons}>
                                <button className="btn btn-primary" onClick={() => approveHandler(ele._id)}>Approve</button>
                            </div>
                        </div>
                    </li>)
                })}
            </ul>
        </div>
    </div>)
}

export default ApproveUser;