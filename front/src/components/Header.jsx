import React from "react";
import { GoBell } from "react-icons/go";

const Header = () => {
    return (
        <div className="flex justify-between items-center p-4">
            <div>
            </div>
            <div className="flex items-center space-x-5">
                <div className="hidden md:flex">
                    <input type="text"
                        placeholder="Rechercher..."
                        className="bg-blue-100/30 px-4 py-2 rounded-lg focus:outline-0 focus:ring-2 focus:ring-blue-500 "

                    />
                </div>
                <div className="flex items-center space-x-5">
                    <button className="relative text-2xl text-gray-600">
                        <GoBell size={28} />
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex justify-center items-center bg-blue-600 text-white font-semibold text-[10px] w-5 h-4 rounded-full border-2 border-white">5</span>
                    </button>
                    <img className="w-8 g-8 rounded-full border-2 border-blue-400" src="https://randomuser.me/api/portraits/women/50.jpg" alt="" />
                </div>

            </div>

        </div>
    );
}

export default Header;