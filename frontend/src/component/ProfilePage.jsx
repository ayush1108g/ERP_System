import React, { useContext } from "react";
import classes from "./ProfilePage.module.css"

import LoginContext from "../store/context/loginContext";
import { useSidebar } from "../store/context/sidebarcontext";
import demoProfilePhoto from "../assets/demo_profile_photo.png";

const Profile_page = () => {
    const Loginctx = useContext(LoginContext);
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const user = Loginctx.user;
    console.log(Loginctx.user);
    const isStudent = Loginctx?.role === "student";

    return (<body className={classes.body} style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <div className={classes.title}>
            <h2 className={classes.h2}> Your Profile </h2>
        </div>
        <div className={classes.grandParent}>
            <div className={classes.parent1}>
                <img className={classes.circularBox} src={user?.personal_info?.profile_picture || demoProfilePhoto} alt="profile" onError={(event) => { event.currentTarget.src = demoProfilePhoto; }} />
                <div className={classes.details}>
                    <div>
                        {user?.personal_info.name}
                    </div>
                    <div>
                        Role : {user?.role}
                    </div>
                    {isStudent && <div>{user?.personal_info?.rollNumber} </div>}
                </div>
            </div>
            <div className={classes.parent2}>
                {isStudent && <div className={classes.lines}>
                    <div className={classes.c1}>
                        Semester
                    </div>
                    <div className={classes.c2}>
                        :  {Loginctx?.user?.academic_info?.semester.join(', ') || "Semester"}
                    </div>
                </div>
                }
                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Email
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.email || "Email"}
                    </div>
                </div>
                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Phone
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.personal_info?.phone || "998XXXXXXX"}
                    </div>
                </div>
                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Gender
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.personal_info?.gender}
                    </div>
                </div>
                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Date of Birth
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.personal_info?.date_of_birth?.slice(0, 10) || "DD-MM-YYYY"}
                    </div>
                </div>
                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Department
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.academic_info?.department.join(', ') || "Department"}
                    </div>
                </div>

                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Program
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.academic_info?.program.join(', ') || "Program"}
                    </div>
                </div>
                <div className={classes.lines}>
                    <div className={classes.c1}>
                        Address
                    </div>
                    <div className={classes.c2}>
                        : {Loginctx?.user?.personal_info?.address || "Address"}
                    </div>
                </div>

            </div>
        </div>

    </body>)
}

export default Profile_page 