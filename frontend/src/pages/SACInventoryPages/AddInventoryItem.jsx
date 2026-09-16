import React, { useState, useContext } from "react";
import classes from "./AddInventoryItem.module.css"
import { useNavigate } from "react-router";
import axios from "axios";

import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useAlert } from "../../store/context/Alert-context";
import { useSidebar } from "../../store/context/sidebarcontext";

const Add_inventory_item = () => {
    const navigate = useNavigate();
    const alertCtx = useAlert();
    const Loginctx = useContext(LoginContext);
    const isSidebarOpen = useSidebar().isSidebarOpen;

    const [equipmentName, setEquipmentName] = useState("");
    const [quantity, setQuantity] = useState("");

    // Function to add equipment to the inventory
    const addEquipment = async (e) => {
        e.preventDefault();
        if (equipmentName.trim().length === 0 || quantity.trim().length === 0) {
            return alertCtx.showAlert("danger", "Fields cannot be empty");
        }
        try {
            const requestBody = {
                equipment_name: equipmentName,
                total_quantity: quantity,
                available_quantity: quantity
            };
            console.log(requestBody);
            const response = await axios.post(`${backendUrl}/api/v1/inventory/add`, requestBody, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}`, }, });
            console.log("Item Added successfully:", response.data);
            setEquipmentName("");
            setQuantity("");
            alertCtx.showAlert("success", "Item Added Successfully");
            navigate('/inventory');

        } catch (error) {
            console.error("Error adding Item:", error);
            if (error?.response?.data?.message) {
                return alertCtx.showAlert("danger", error.response.data.message);
            }
            alertCtx.showAlert("danger", "Error adding Item");
        }
    };

    return (<div style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <h3 className={classes.title}>Add Equipment</h3>
        <form className={classes.inputform}>
            <div className="mb-3">
                <label htmlFor="1" className="form-label">Equipment Name</label>
                <input type="text" className="form-control" id="1" aria-describedby="emailHelp" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} />
            </div>
            <div className="mb-3">
                <label htmlFor="2" className="form-label">Total Quantity</label>
                <input type="text" className="form-control" id="2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" onClick={(e) => addEquipment(e)}>Submit</button>
        </form>

    </div>)
}

export default Add_inventory_item;