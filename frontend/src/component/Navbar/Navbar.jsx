import React, { useContext } from "react";
import "./Navbar.css";
import { MdBarChart, MdFeedback, MdHome, MdInfo, MdInventory, MdAppRegistration } from "react-icons/md";
import { BiLogOut } from "react-icons/bi";
import { HiAcademicCap } from "react-icons/hi2";
import { useNavigate, useLocation } from "react-router";

import iitbbslogo from "../../assets/iitbbs_logo.jpeg";
import LoginContext from "../../store/context/loginContext";


function Navbar(props) {
  const LoginCtx = useContext(LoginContext);
  const navigate = useNavigate();
  const location = useLocation();

  const makeActive = location.pathname === '/' || location.pathname === '/admin';
  // Navbar items
  const navItems = [
    { name: "home", path: "/", icon: <MdHome />, },
    { name: "courses", path: "/my_courses", icon: <HiAcademicCap />, },
    { name: "Registration", path: "/registration", icon: <MdAppRegistration />, },
    { name: "inventory", path: "/inventory", icon: <MdInventory />, },
    { name: "profile", path: "/profile", icon: <MdInfo />, },
    makeActive && { name: "feedback", path: "/feedback", icon: <MdFeedback />, },
    makeActive && { name: "attendance", path: "/attendance", icon: <MdBarChart />, },
  ];

  // Navigate to the path
  const navigateHandler = (path) => {
    console.log(path);
    if (path === '/attendance') {
      return props.handleAttendance();
    } else if (path === '/feedback') {
      return props.openModal('feedback');
    }
    navigate(path);
  }

  return (
    <div>
      <div className={`navbar ${props.className}`} style={props.style}>
        <div className="iitbbs" onClick={() => navigate("/")}>
          <img src={iitbbslogo} alt="" />
          <h3>IIT BBS</h3>
        </div>
        {<div
          className="navbar-item"
          onClick={() => { LoginCtx.logout(); navigate("/login") }}
        >
          <div className="icon">{<BiLogOut />}</div>
          <div className="name">{"Logout"}</div>
        </div>}
        {navItems.map((item, index) => {
          return (
            <div
              className="navbar-item"
              key={index}
              onClick={() => navigateHandler(item.path)}
            >
              <div className="icon">{item.icon}</div>
              <div className="name">{item.name}</div>
            </div>
          );
        })}

      </div>
    </div>
  );
}

export default Navbar;
