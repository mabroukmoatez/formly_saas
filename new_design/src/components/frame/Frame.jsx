/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import "./style.css";

export const Frame = ({
  property1,
  className,
  propertyEdit = "https://c.animaapp.com/W8b60tJ9/img/property-1-edit.svg",
  propertyDelete = "https://c.animaapp.com/W8b60tJ9/img/property-1-delete.svg",
}) => {
  return (
    <img
      className={`frame ${className}`}
      alt="Property edit"
      src={
        property1 === "edit-hover"
          ? "https://c.animaapp.com/W8b60tJ9/img/property-1-edit-hover.svg"
          : property1 === "dellet-hover"
            ? "https://c.animaapp.com/W8b60tJ9/img/property-1-dellet-hover.svg"
            : property1 === "delete"
              ? propertyDelete
              : propertyEdit
      }
    />
  );
};
