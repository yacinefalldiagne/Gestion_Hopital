import React, { useState } from "react";
import { LuUser } from "react-icons/lu";
import { Link } from "react-router-dom";
import logo from "../assets/image/logo.avif";
import { SIDEBAR_LINKS } from "../data/sidebarConfig";

const Sidebar = ({ userRole }) => {
    const [activeLink, setActiveLink] = useState(0);

    const handleClick = (index) => {
        setActiveLink(index);
    };

    // Sélectionner les liens en fonction du rôle de l'utilisateur
    const links = SIDEBAR_LINKS[userRole] || [];

    return (
        <div className="w-16 md:w-56 fixed left-0 top-0 z-10 h-screen border-r pt-8 px-4 bg-blue-100 bg-opacity-70 text-gray-800 shadow-lg flex flex-col">
            <div className="mb-8 flex justify-center md:justify-start">
                <img src={logo} alt="Logo" className="w-8" />
            </div>

            <ul className="mt-6 space-y-6 flex-1">
                {links.map((link, index) => (
                    <li
                        key={index}
                        className={`font-medium rounded-md py-2 px-5 hover:bg-blue-200 hover:text-gray-900  
                            ${activeLink === index ? "bg-blue-200 text-gray-900" : ""}`}
                    >
                        <Link
                            to={link.path}
                            className="flex justify-center md:justify-start items-center md:space-x-5"
                            onClick={() => handleClick(index)}
                        >
                            <span>{React.createElement(link.icon, { className: "text-xl" })}</span>
                            <span className="text-sm hidden md:flex">
                                {link.name}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="w-full px-4 py-4">
                <button className="flex items-center justify-center md:justify-start space-x-2 w-full text-sm text-gray-800 py-2 px-5 bg-blue-200 rounded-md cursor-pointer hover:bg-blue-300 transition-colors">
                    <span className="text-lg"><LuUser /></span>
                    <span className="hidden md:flex">Déconnexion</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;