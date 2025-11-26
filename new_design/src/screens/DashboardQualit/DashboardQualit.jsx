import React from "react";
import { Frame } from "../../components/Frame";
import "./style.css";

export const DashboardQualit = () => {
  return (
    <div className="dashboard-qualit" data-model-id="2063:21166">
      <img
        className="sidebar"
        alt="Sidebar"
        src="https://c.animaapp.com/W8b60tJ9/img/sidebar.png"
      />

      <div className="div">
        <div className="top-right-BTN-add">
          <img
            className="img"
            alt="Frame"
            src="https://c.animaapp.com/W8b60tJ9/img/frame-1984078484.svg"
          />

          <div className="ajouter-un">Ajouter Un Collaborateur</div>
        </div>

        <div className="main-section">
          <div className="left-section">
            <img
              className="img-2"
              alt="Div systemequalite"
              src="https://c.animaapp.com/W8b60tJ9/img/div-systemequalite.png"
            />

            <img
              className="div-2"
              alt="Div"
              src="https://c.animaapp.com/W8b60tJ9/img/div-indicateursqualiopi.png"
            />

            <div className="two-div-in-same-row">
              <img
                className="div-lesactions"
                alt="Div lesactions"
                src="https://c.animaapp.com/W8b60tJ9/img/div-lesactions-taches.png"
              />

              <img
                className="div-3"
                alt="Div"
                src="https://c.animaapp.com/W8b60tJ9/img/div-dernierselementsjoutes.png"
              />
            </div>
          </div>

          <div className="right-section">
            <div className="div-prochaineaudit">
              <div className="group">
                <div className="div-wrapper">
                  <div className="text-wrapper">Prochain audit</div>
                </div>

                <div className="frame-2">
                  <div className="frame-wrapper">
                    <div className="frame-3">
                      <div className="text-wrapper-2">J - 200</div>
                    </div>
                  </div>

                  <div className="frame-4">
                    <div className="frame-5">
                      <div className="text-wrapper">Audit initial</div>

                      <div className="text-wrapper-3">17 juin 2025</div>
                    </div>

                    <div className="frame-6">
                      <Frame
                        className="frame-21"
                        property1="edit"
                        propertyEdit="https://c.animaapp.com/W8b60tJ9/img/frame-21-1.svg"
                      />
                      <Frame
                        className="frame-21"
                        property1="delete"
                        propertyDelete="https://c.animaapp.com/W8b60tJ9/img/frame-1000000932-1.svg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <img
              className="line"
              alt="Line"
              src="https://c.animaapp.com/W8b60tJ9/img/line.svg"
            />

            <img
              className="img-2"
              alt="Div actualite"
              src="https://c.animaapp.com/W8b60tJ9/img/div-actualite.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
