import React, { useState, useContext, useEffect } from "react";
import classes from './InventoryForm.module.css'
import { useParams } from 'react-router-dom';
import { useNavigate } from "react-router"
import axios from 'axios';

import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useAlert } from "../../store/context/Alert-context";
import { useSidebar } from "../../store/context/sidebarcontext";

const Inventory_form = () => {
  const Alertctx = useAlert();
  const Loginctx = useContext(LoginContext);
  const navigate = useNavigate();
  const { equipmentId } = useParams();
  const isSidebarOpen = useSidebar().isSidebarOpen;

  const [equipmentData, setEquipmentData] = useState(null);
  let isadmin = Loginctx.role === 'admin';

  useEffect(() => {
    // Fetch the equipment data from the backend
    const fetchdata = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/v1/inventory/' + equipmentId, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}` } });
        const equipment = response.data.equipment;
        setEquipmentData(equipment);
        console.log(equipment);
      } catch (err) {
        console.log(err);
      }
    };
    fetchdata();
  }, [equipmentId, Loginctx.AccessToken]);

  // Function to issue the equipment
  const handleIssueEquipment = async () => {
    console.log("Button Pressed");
    if (!Loginctx.isLoggedIn) {
      Alertctx.showAlert("Please Login to Issue Equipment");
      return navigate('/login');
    }
    if (equipmentData.available_quantity === 0) {
      return Alertctx.showAlert("No Equipment Available");
    }

    try {
      const response = await axios.post(backendUrl + '/api/v1/inventory', { equipmentId: equipmentId, issued_date: new Date().toISOString().slice(0, 10) }, {
        headers: { Authorization: `Bearer ${Loginctx.AccessToken}` }
      });
      console.log(response.data);
      Alertctx.showAlert("danger", "Equipment Issued Successfully");
      setTimeout(() => {
        navigate('/inventory');
      }, 1000);
    } catch (error) {
      console.error('Error issuing equipment:', error);
      Alertctx.showAlert("danger", "Error Issuing Equipment");
    }
  };

  // Function to navigate to the update page
  const openUpdateItemPage = () => {
    navigate(`/${equipmentId}/update_inventory_item`)
  }

  return (
    <div style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
      {equipmentData && (
        <>
          <h1 className={classes.title}>{equipmentData.equipment_name}</h1>
          <div className={classes.gridContainer}>
            <div className={classes.gridItem}>
              <div> Quantity Available: </div>
              <div className={classes.yoyo}>{equipmentData.available_quantity}</div>
              {
                isadmin &&
                <button type="button" className="btn btn-success" onClick={() => openUpdateItemPage()}>Update</button>
              }
            </div>
            <div className={classes.gridItem}>
              <div>Total Quantity : </div>
              <div className={classes.yoyo}>{equipmentData.total_quantity}</div>
            </div>
            <div className={classes.gridItem}>
              <div>Last Updated : </div>
              <div className={classes.yoyo}>{new Date(equipmentData.last_updated).toLocaleString()}</div>
            </div>
          </div>

          {isadmin && <table className={classes.issueTable}>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Issue Date</th>
              </tr>
            </thead>

            <tbody>
              {equipmentData.issued_to.map((item, index) => (
                <tr key={index}>
                  <td>{item.student_id}</td>
                  <td>{item.issued_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          }

          <div className={classes.button}>
            <h2 className={classes.title}>To Issue the Equipment Click Below</h2>
            <button type="button" className={`btn btn-success`} onClick={(handleIssueEquipment)}>Issue the Equipment</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Inventory_form;

