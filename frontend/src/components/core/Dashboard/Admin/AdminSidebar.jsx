import { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { FaUsers, FaBookOpen, FaChartBar, FaGraduationCap, FaQuestionCircle, FaStar, FaComments, FaTag, FaChartLine, FaCommentDots, FaBriefcase, FaEnvelope } from 'react-icons/fa';
import { MdSettings, MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { FiBell } from 'react-icons/fi';
import { VscSignOut, VscPackage, VscGitPullRequestCreate, VscSymbolClass } from "react-icons/vsc";
import { HiMenuAlt1 } from 'react-icons/hi';
import { IoMdClose } from 'react-icons/io';
import { useNavigate } from "react-router-dom";
import { toggleSidebarCollapse, setOpenSideMenu, setScreenSize } from '../../../../slices/sidebarSlice';
import { logout } from "../../../../services/operations/authAPI";
import ConfirmationModal from "../../../common/ConfirmationModal";

const AdminSidebar = ({ activeTab, onTabChange }) => {
  const { isCollapsed, openSideMenu, screenSize } = useSelector((state) => state.sidebar);
  const { user, loading: profileLoading } = useSelector((state) => state.profile);
  const { loading: authLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmationModal, setConfirmationModal] = useState(null);

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'analytics', label: 'Analytics', icon: <FaChartBar size={16} /> },
    { id: 'users', label: 'Users', icon: <FaUsers size={16} /> },
    { id: 'courses', label: 'Courses', icon: <FaBookOpen size={16} /> },
    { id: 'categories', label: 'Course Categories', icon: <VscSymbolClass size={16} /> },
    { id: 'studentProgress', label: 'Student Progress', icon: <FaChartLine size={16} /> },
    { id: 'quizzes', label: 'Quiz Management', icon: <FaQuestionCircle size={16} /> },
    { id: 'featuredCourses', label: 'Featured Courses', icon: <FaStar size={16} /> },
    { id: 'accessRequests', label: 'Access Requests', icon: <FaUsers size={16} /> },
    { id: 'bundleRequests', label: 'Bundle Requests', icon: <VscGitPullRequestCreate size={16} /> },
    { id: 'orders', label: 'Orders', icon: <VscPackage size={16} /> },
    { id: 'coupons', label: 'Coupons', icon: <FaTag size={16} /> },
    { id: 'careers', label: 'Careers', icon: <FaBriefcase size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell size={16} /> },
    { id: 'contactMessages', label: 'Contact Messages', icon: <FaEnvelope size={16} /> },
    { id: 'faqs', label: 'FAQ Management', icon: <FaComments size={16} /> },
    { id: 'chats', label: 'Manage Chats', icon: <FaCommentDots size={16} /> },
  ];

  useEffect(() => {
    const handleResize = () => dispatch(setScreenSize(window.innerWidth));
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // If screen size is small then close the side bar
  useEffect(() => {
    if (screenSize <= 640) {
      dispatch(setOpenSideMenu(false));
    } else {
      dispatch(setOpenSideMenu(true));
    }
  }, [screenSize, dispatch]);

  if (profileLoading || authLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] min-w-[200px] items-center justify-center bg-richblack-800 border-r border-richblack-700">
        <div className="relative">
          <div className="w-6 h-6 border-2 border-richblack-700 border-t-yellow-50 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="sm:hidden fixed top-20 left-4 z-[60]">
        <button 
          onClick={() => dispatch(setOpenSideMenu(!openSideMenu))}
          className="p-3 rounded-xl bg-richblack-800 border border-richblack-700 text-white hover:bg-richblack-700 transition-colors duration-200 shadow-md"
        >
          {openSideMenu ? <IoMdClose size={16} /> : <HiMenuAlt1 size={16} />}
        </button>
      </div>

      {/* Sidebar */}
      {openSideMenu && (
        <>
          {/* Mobile Overlay */}
          {screenSize <= 640 && (
            <div 
              className="fixed inset-0 bg-black/50 z-[45] sm:hidden"
              onClick={() => dispatch(setOpenSideMenu(false))}
            />
          )}
          
          <div className={`fixed sm:relative h-[100vh] ${
            isCollapsed ? 'w-[56px]' : 'w-[240px] sm:w-[200px]'
          } flex flex-col bg-richblack-800 border-r border-richblack-700 transition-all duration-300 z-50`}>
            {/* Collapse/Expand Button - Desktop Only */}
            {screenSize > 640 && (
              <div className="absolute -right-2 top-20 z-[1001]">
                <button
                  onClick={() => dispatch(toggleSidebarCollapse())}
                  className="w-6 h-6 bg-richblack-700 border border-richblack-600 rounded-full flex items-center justify-center text-richblack-200 hover:text-yellow-50 hover:bg-richblack-600 transition-colors duration-200"
                >
                  {isCollapsed ? <MdKeyboardArrowRight size={14} /> : <MdKeyboardArrowLeft size={14} />}
                </button>
              </div>
            )}

            {/* Top Spacer */}
            <div className="h-20 sm:h-0 flex-shrink-0"></div>

            {/* User Profile Section */}
            <div className={`${isCollapsed ? 'p-2' : 'p-3'} border-b border-richblack-700 transition-all duration-300 flex-shrink-0`}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="relative">
                  <img
                    src={user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-yellow-50/30"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-caribbeangreen-300 rounded-full border-2 border-richblack-800"></div>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h3 className="text-richblack-5 font-medium text-xs truncate">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-richblack-200 text-xs truncate capitalize">
                      Admin
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Links - Scrollable Container */}
            <div className="flex-1 overflow-hidden">
              <div className={`h-full py-3 ${isCollapsed ? 'px-1' : 'px-2'} overflow-y-scroll scrollbar-thin scrollbar-track-richblack-800 scrollbar-thumb-richblack-700 hover:scrollbar-thumb-richblack-600 scrollbar-thumb-rounded-full scrollbar-track-rounded-full`}>
                <nav className="space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-1' : 'gap-2 px-3'
                      } py-2 rounded-lg transition-colors duration-200 group relative ${
                        activeTab === item.id
                          ? 'bg-richblack-700 text-yellow-50'
                          : 'text-richblack-200 hover:text-yellow-50 hover:bg-richblack-700'
                      }`}
                      title={isCollapsed ? item.label : ""}
                    >
                      <span className="text-sm">{item.icon}</span>
                      {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                      
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-richblack-700 text-yellow-50 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Divider */}
                <div className="my-3 h-px bg-richblack-700" />

                {/* Logout */}
                <div className="space-y-1">
                  <button
                    onClick={() =>
                      setConfirmationModal({
                        text1: "Are you sure?",
                        text2: "You will be logged out of your account.",
                        btn1Text: "Logout",
                        btn2Text: "Cancel",
                        btn1Handler: () => dispatch(logout(navigate)),
                        btn2Handler: () => setConfirmationModal(null),
                      })
                    }
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-1' : 'gap-2 px-3'} py-2 text-richblack-200 hover:text-yellow-50 hover:bg-richblack-700 rounded-lg transition-colors duration-200 group`}
                    title={isCollapsed ? "Logout" : ""}
                  >
                    <VscSignOut className="text-sm group-hover:text-red-400 transition-colors duration-200" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                  </button>
                </div>

                {/* Footer */}
                {!isCollapsed && (
                  <div className="mt-4 pt-2 border-t border-richblack-700">
                    <div className="text-center">
                      <p className="text-xs text-richblack-400">
                        © 2024 Beeja
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} closeModal={() => setConfirmationModal(null)} />}
    </>
  );
};

export default AdminSidebar;
