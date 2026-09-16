import React, { useContext } from "react";
import classes from "../App.module.css";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { useLocation } from "react-router";

import Navbar from "../component/Navbar/Navbar";
import RoutesWithAnimation from "./RoutesWithAnimation.jsx";
import FullAuthLoader from "./FullAuthLoader.js";
import LoginContext from "../store/context/loginContext";
import { useSidebar } from "../store/context/sidebarcontext";

// Main content with All routes
const MainContent = () => {
    const loginCtx = useContext(LoginContext);
    const location = useLocation();
    const sidebarCtx = useSidebar();
    const isSidebarOpen = sidebarCtx.isSidebarOpen;
    const handleSidebar = sidebarCtx.toggleSidebar;
    const sidebarNotRequired = [
        "/login",
        "/signup",
        "/forgotpassword",
        "/",
        "/admin",
    ];
    return (
        <div className={classes.shell}>
            {loginCtx.loading && <FullAuthLoader />}

            {!sidebarNotRequired.includes(location.pathname) &&
                !location.pathname.includes("/login") && (
                    <div className={classes.navbar}>
                        <Navbar className={classes.navbar2} style={{ display: isSidebarOpen ? "block" : "none", }} />
                        <button type="button" className={classes.icon} aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"} title={isSidebarOpen ? "Collapse navigation" : "Expand navigation"} style={{ position: "fixed", left: isSidebarOpen ? "203px" : "5px", zIndex: 10, top: "48vh", }} onClick={handleSidebar}>
                            {isSidebarOpen ? <MdArrowBackIosNew /> : <MdArrowForwardIos />}
                        </button>
                    </div>
                )}
            <RoutesWithAnimation />
        </div>
    );
};

export default MainContent;
