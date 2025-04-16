import React from "react";
import { FaCalendarAlt, FaUserMd, FaWallet, FaChartPie, FaBell, FaChevronLeft, FaChevronRight } from "react-icons/fa";

function Patient() {
    const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
    const firstDayOfMonth = new Date(2017, 11, 1).getDay(); // December 2017, starts on Friday (index 5)

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Patient Dashboard</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-6 bg-blue-100 rounded-lg shadow-sm">
                    <FaCalendarAlt className="text-3xl text-blue-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">72</h2>
                    <p className="text-gray-600">Scheduled</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-pink-100 rounded-lg shadow-sm">
                    <FaUserMd className="text-3xl text-pink-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">23</h2>
                    <p className="text-gray-600">Waiting</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-green-100 rounded-lg shadow-sm">
                    <FaWallet className="text-3xl text-green-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">40</h2>
                    <p className="text-gray-600">Engaged</p>
                </div>
                <div className="flex flex-col items-center p-6 bg-yellow-100 rounded-lg shadow-sm">
                    <FaChartPie className="text-3xl text-yellow-600 mb-2" />
                    <h2 className="text-3xl font-bold text-gray-900">120</h2>
                    <p className="text-gray-600">Checkout</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Section */}
                <div className="md:col-span-1">
                    {/* Doctor List */}
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Doctors</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src="https://randomuser.me/api/portraits/men/10.jpg"
                                        alt="Doctor"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Dr. Sathish</p>
                                    </div>
                                </div>
                                <span className="bg-green-100 text-green-600 text-sm font-medium px-2 py-1 rounded">15</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src="https://randomuser.me/api/portraits/women/10.jpg"
                                        alt="Doctor"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Dr. Ram Kumar</p>
                                    </div>
                                </div>
                                <span className="bg-red-100 text-red-600 text-sm font-medium px-2 py-1 rounded">15</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src="https://randomuser.me/api/portraits/men/50.jpg"
                                        alt="Doctor"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Dr. Mohan</p>
                                    </div>
                                </div>
                                <span className="bg-blue-100 text-blue-600 text-sm font-medium px-2 py-1 rounded">15</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src="https://randomuser.me/api/portraits/women/30.jpg"
                                        alt="Doctor"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Dr. Vicky</p>
                                    </div>
                                </div>
                                <span className="bg-orange-100 text-orange-600 text-sm font-medium px-2 py-1 rounded">15</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <img
                                        src="https://randomuser.me/api/portraits/women/50.jpg"
                                        alt="Doctor"
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Dr. Naveen</p>
                                    </div>
                                </div>
                                <span className="bg-purple-100 text-purple-600 text-sm font-medium px-2 py-1 rounded">15</span>
                            </div>
                            <button className="w-full mt-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                More
                            </button>
                        </div>
                    </div>
                </div>

                {/* Middle Section - Calendar */}
                <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <FaChevronLeft className="text-gray-600" />
                            <span className="text-lg font-semibold text-gray-800">December 2017</span>
                            <FaChevronRight className="text-gray-600" />
                        </div>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-pink-100 text-pink-600 rounded-lg">AM</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">PM</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">Month</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">Week</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg">Day</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {daysOfWeek.map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-600">
                                {day}
                            </div>
                        ))}
                        {Array(firstDayOfMonth).fill(null).map((_, index) => (
                            <div key={`empty-${index}`} className="h-16"></div>
                        ))}
                        {daysInMonth.map((day) => (
                            <div key={day} className="h-16 border border-gray-200 p-2 text-sm relative">
                                <span>{day}</span>
                                {day === 1 && (
                                    <div className="absolute top-6 left-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">9:00 AM Sathish</div>
                                )}
                                {day === 4 && (
                                    <div className="absolute top-6 left-2 text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded">11:00 AM Mohan</div>
                                )}
                                {day === 8 && (
                                    <div className="absolute top-6 left-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">06:00 PM Naveen</div>
                                )}
                                {day === 10 && (
                                    <div className="absolute top-6 left-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">10:00 PM Vicky</div>
                                )}
                                {day === 20 && (
                                    <div className="absolute top-6 left-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">11:00 AM Sathish</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Patient;