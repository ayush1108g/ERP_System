import React, { useState, useEffect, useContext } from "react";
import classes from "./SpecificCourseAssignments.module.css";

import { FaPlus } from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router";
import { useCookies } from "react-cookie";
import axios from 'axios';

import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useAlert } from "../../store/context/Alert-context";
import { useSidebar } from "../../store/context/sidebarcontext";


const SpecificCourseAssignments = () => {
  const alertCtx = useAlert();
  const navigate = useNavigate();
  const Loginctx = useContext(LoginContext);
  const { courseId } = useParams();
  const [cookie] = useCookies(["AccessToken", "RefreshToken"]);
  const isSidebarOpen = useSidebar().isSidebarOpen;

  const [assignmentData, setAssignmentData] = useState([]);
  const canManageAssignments = Loginctx.role === 'admin'
    || (Loginctx.role === 'teacher' && (Loginctx.user?.courses_taught || []).some((course) => String(course?._id || course) === String(courseId)));

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/v1/courses/' + courseId, { headers: { Authorization: `Bearer ${cookie.AccessToken}` } });
        const assignmentInfo = response.data.data.data[0].assignments;
        setAssignmentData(assignmentInfo);
      } catch (err) {
        console.log(err);
        if (err?.response?.data?.message) {
          return alertCtx.showAlert("Error loading assignments", "error");
        }
        alertCtx.showAlert("Error loading assignments", "error");
      }
    };
    setTimeout(() => {
      fetchdata();
    }, 100);
  }, [courseId]);

  // Function to format the date in the required format 
  const formatDate = dateString => {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const day = date.getDate();
    let suffix;
    if (day >= 11 && day <= 13) {
      suffix = 'th';
    } else {
      switch (day % 10) {
        case 1:
          suffix = 'st';
          break;
        case 2:
          suffix = 'nd';
          break;
        case 3:
          suffix = 'rd';
          break;
        default:
          suffix = 'th';
      }
      // Add the ordinal suffix to the formatted date
      const ordinalDate = formattedDate.replace(/\b\d{1,2}\b/, match => match + suffix);
      return ordinalDate;
    };
  };

  // Function to navigate to the specific assignment page
  const openSpecificAssignmentPage = (assignmentId) => {
    navigate(`/my_courses/${courseId}/assignments/${assignmentId}`)
  }

  // Function to navigate to the add assignment page
  const openAddAssignmentPage = () => {
    navigate(`/${courseId}/assignment_upload`);
  }

  return (<div className={classes.Body} style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
    <h2 className={classes.title}><div>Your Assignments</div></h2>
    {canManageAssignments &&
      <h5 style={{ margin: '30px', display: 'flex' }} onClick={() => openAddAssignmentPage()}>
        <div> <FaPlus color="blue" /></div>
        <div> Add Assignments/Comments </div>
      </h5>}
    {assignmentData.map((ele, ind) => {
      return (<>
        <div className={classes.a} onClick={() => openSpecificAssignmentPage(ele.assignment_id)}>
          <div>
            <MdAssignment color="blue" size={"25px"} />  {ele.name}
          </div>
          <div className={classes.date}>
            Due date : {formatDate(ele.due_date)}
          </div>
        </div>
      </>)
    })
    }
  </div>)
}

export default SpecificCourseAssignments; 