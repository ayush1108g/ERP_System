import React, { useState, useContext } from "react";
import classes from "./AddInventoryItem.module.css"

import { useNavigate, useParams } from "react-router";
import axios from "axios";

import { backendUrl } from "../../constant";
import LoginContext from "../../store/context/loginContext";
import { useSidebar } from "../../store/context/sidebarcontext";

const UpdateInventoryItem = () => {
    const navigate = useNavigate();
    const Loginctx = useContext(LoginContext);
    const { equipmentId } = useParams();
    const { isSidebarOpen } = useSidebar();

    const [quantity, setQuantity] = useState("");

    // Function to update equipment in the inventory
    const updateEquipment = async (e) => {
        e.preventDefault();
        try {
            const requestBody = {
                equipmentId: equipmentId,
                available_quantity: quantity
            };
            console.log(requestBody);
            const response = await axios.patch(`${backendUrl}/api/v1/inventory`, requestBody, { headers: { Authorization: `Bearer ${Loginctx.AccessToken}`, }, });
            console.log("Item Updated successfully:", response.data);
            setQuantity("");
            alert("Item Updated!");
            navigate('/inventory');
        } catch (error) {
            console.error("Error updating Item:", error);
        }
    };

    return (<div style={{ marginLeft: isSidebarOpen ? '210px' : '10px' }}>
        <h3 className={classes.title}>Update Equipment</h3>
        <form className={classes.inputform}>
            <div className="mb-3">
                <label htmlFor="2" className="form-label">Available Quantity</label>
                <input type="text" className="form-control" id="2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" onClick={(e) => updateEquipment(e)}>Update</button>
        </form>

    </div>)
}

export default UpdateInventoryItem;