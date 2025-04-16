import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout = ({ userRole }) => {
    return (
        <div className="layout">
            <div className="flex">
                <Sidebar userRole={userRole} />
                <div className="w-full ml-16 md:ml-56">

                    <Header />
                    <Outlet />

                </div>
            </div>

        </div>
    );
}

export default Layout;