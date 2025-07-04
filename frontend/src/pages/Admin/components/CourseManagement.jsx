import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAllCourses, approveCourse, deleteCourse, toggleCourseVisibility } from "../../../services/operations/adminAPI";
import { getFullDetailsOfCourse } from "../../../services/operations/courseDetailsAPI";
import { FaCheck, FaTrash, FaEye, FaEyeSlash, FaPlus, FaEdit, FaSearch, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import CreateCourse from "./CreateCourse/CreateCourse";
import EditCourse from "./EditCourse";

const CourseManagement = () => {
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const [courses, setCourses] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch courses from backend API
  const fetchCourses = async () => {
    setLoading(true);
    try {
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching courses with token:", token);
      const response = await getAllCourses(token);
      console.log("Courses response:", response);
      
      if (!response || !response.courses) {
        throw new Error("No courses data received");
      }

      setCourses(response.courses);
      setError(null);
    } catch (err) {
      console.error("Error fetching courses:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch courses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    } else {
      setError("Authentication token is missing");
      toast.error("Please log in to access course management");
    }
  }, [token]);

  const handleApproveCourse = async (courseId) => {
    try {
      await approveCourse(courseId, token);
      fetchCourses(); // Refresh course list
    } catch (error) {
      setError(error.message);
    }
  };

  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [togglingCourseId, setTogglingCourseId] = useState(null);

  const handleDeleteCourse = async (courseId) => {
    if (!token) {
      toast.error("Authentication token is missing");
      return;
    }

    try {
      setDeletingCourseId(courseId);
      setError(null);

      // Log deletion attempt
      console.log('Attempting to delete course:', {
        courseId,
        tokenExists: !!token
      });
      
      const result = await deleteCourse(courseId, token);
      
      if (result) {
        toast.success("Course deleted successfully");
        await fetchCourses(); // Refresh course list
      }
      
    } catch (error) {
      console.error('Delete operation failed:', {
        error: error.message,
        courseId,
        response: error.response?.data
      });
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete course';
      toast.error(errorMessage);
      setError(errorMessage);
      
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleToggleVisibility = async (courseId) => {
    if (!token) {
      toast.error("Authentication token is missing");
      return;
    }
    try {
      console.log("Toggling visibility for course:", courseId);
      setTogglingCourseId(courseId);
      const response = await toggleCourseVisibility(courseId, token);
      if (response) {
        toast.success("Course visibility updated successfully");
        await fetchCourses(); // Refresh the course list
      }
    } catch (error) {
      console.error('Toggle course visibility failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update course visibility');
    } finally {
      setTogglingCourseId(null);
    }
  };

  const handleEditCourse = async (course) => {
    try {
      console.log("Fetching full course details for editing...");
      const fullCourseDetails = await getFullDetailsOfCourse(course._id, token);
      if (fullCourseDetails?.data) {
        console.log("Full course details fetched:", fullCourseDetails.data);
        setEditingCourse(fullCourseDetails.data);
      } else {
        console.log("Using basic course details:", course);
        setEditingCourse(course);
      }
    } catch (error) {
      console.error("Error fetching full course details:", error);
      toast.error("Error loading course details");
      setEditingCourse(course);
    }
    setShowCreateCourse(false);
  };

  const handleViewCourse = (courseId) => {
    // Implement course preview/details view
    console.log("View course:", courseId);
  };

  // Filter courses based on search term and status
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === "" || 
      course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${course.instructor?.firstName} ${course.instructor?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "published" && course.status === "Published") ||
      (statusFilter === "draft" && course.status === "Draft") ||
      (statusFilter === "visible" && course.isVisible) ||
      (statusFilter === "hidden" && !course.isVisible);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCourses = courses.length;
  // Pending courses are those in Draft status and visible (submitted for approval)
  const pendingCourses = courses.filter(course => 
    course.status === 'Draft' && course.isVisible
  ).length;
  const activeCourses = courses.filter(course => course.status === 'Published').length;

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="text-richblack-5">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <h4 className="text-lg font-semibold">Course Management</h4>
          <button
            onClick={() => setShowCreateCourse(true)}
            className="flex items-center gap-2 bg-yellow-50 text-richblack-900 px-4 py-2 rounded-lg hover:bg-yellow-100 transition-colors w-full sm:w-auto justify-center sm:justify-start"
          >
            <FaPlus className="w-4 h-4" />
            Create Course
          </button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-richblack-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses by title, instructor, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 placeholder-richblack-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-richblack-400 hover:text-richblack-200"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-richblack-700 border border-richblack-600 rounded-lg text-richblack-5 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-300"
              >
                <option value="all">All Courses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-2 px-4 py-2.5 bg-richblack-600 text-richblack-200 rounded-lg hover:bg-richblack-500 transition-colors whitespace-nowrap"
              >
                <FaTimes className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>

          {/* Search Results Info */}
          {(searchTerm || statusFilter !== "all") && (
            <div className="text-sm text-richblack-300">
              Showing {filteredCourses.length} of {totalCourses} courses
              {searchTerm && (
                <span> matching "{searchTerm}"</span>
              )}
              {statusFilter !== "all" && (
                <span> with status "{statusFilter}"</span>
              )}
            </div>
          )}
        </div>
        
        {/* Course Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-richblack-700 p-2.5 rounded">
            <h5 className="text-xs text-richblack-50">Total Courses</h5>
            <p className="text-lg font-semibold text-yellow-50 mt-0.5">{totalCourses}</p>
          </div>
          <div className="bg-richblack-700 p-2.5 rounded">
            <h5 className="text-xs text-richblack-50">Pending Approval</h5>
            <p className="text-lg font-semibold text-yellow-50 mt-0.5">{pendingCourses}</p>
          </div>
          <div className="bg-richblack-700 p-2.5 rounded">
            <h5 className="text-xs text-richblack-50">Active Courses</h5>
            <p className="text-lg font-semibold text-yellow-50 mt-0.5">{activeCourses}</p>
          </div>
        </div>
      </div>

      {loading && <p>Loading courses...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {editingCourse ? (
        <EditCourse
          course={editingCourse}
          onCancel={() => setEditingCourse(null)}
          onSave={(updatedCourse) => {
            setEditingCourse(null);
            fetchCourses();
          }}
        />
      ) : showCreateCourse ? (
        <CreateCourse onCancel={() => setShowCreateCourse(false)} />
      ) : !loading && !error && (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-richblack-700">
                  <th className="p-3 border border-richblack-600">Title</th>
                  <th className="p-3 border border-richblack-600">Instructor</th>
                  <th className="p-3 border border-richblack-600">Category</th>
                  <th className="p-3 border border-richblack-600">Price</th>
                  <th className="p-3 border border-richblack-600">Status</th>
                  <th className="p-3 border border-richblack-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center">
                      {courses.length === 0 ? "No courses found." : "No courses match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((course) => (
                    <tr key={course._id} className="border-b border-richblack-600 hover:bg-richblack-700/50">
                      <td className="p-3">{course.courseName}</td>
                      <td className="p-3">
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </td>
                      <td className="p-3">{course.category?.name || 'N/A'}</td>
                      <td className="p-3">₹{course.price}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          course.status === 'Published'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {course.status || 'Draft'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleVisibility(course._id)}
                            className={`flex items-center gap-2 px-3 py-1.5 ${
                              course.isVisible 
                                ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                                : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                            } rounded-lg transition-colors disabled:opacity-50`}
                            disabled={togglingCourseId === course._id}
                            title={course.isVisible ? 'Hide Course' : 'Show Course'}
                          >
                            {togglingCourseId === course._id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"/>
                            ) : (
                              <>
                                {course.isVisible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                                <span className="text-xs font-medium">
                                  {course.isVisible ? 'Visible' : 'Hidden'}
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Edit Course"
                          >
                            <FaEdit size={16} />
                            <span className="text-xs font-medium">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course._id)}
                            disabled={deletingCourseId === course._id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Course"
                          >
                            {deletingCourseId === course._id ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"/>
                            ) : (
                              <>
                                <FaTrash size={16} />
                                <span className="text-xs font-medium">Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="text-center p-6 bg-richblack-700 rounded-lg">
                <p>{courses.length === 0 ? "No courses found." : "No courses match your search criteria."}</p>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div key={course._id} className="bg-richblack-700 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-white truncate">{course.courseName}</h5>
                      <p className="text-sm text-richblack-300">
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ml-2 ${
                      course.status === 'Published'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {course.status || 'Draft'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-richblack-300">
                    <div>
                      <span className="font-medium">Category:</span> {course.category?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> ₹{course.price}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t border-richblack-600">
                    <button
                      onClick={() => handleToggleVisibility(course._id)}
                      className={`flex items-center gap-1 px-3 py-2 rounded ${
                        course.isVisible 
                          ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' 
                          : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                      } transition-colors disabled:opacity-50`}
                      disabled={togglingCourseId === course._id}
                      title={course.isVisible ? 'Hide Course' : 'Show Course'}
                    >
                      {togglingCourseId === course._id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"/>
                      ) : (
                        <>
                          {course.isVisible ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
                          <span className="text-xs">
                            {course.isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditCourse(course)}
                      className="flex items-center gap-1 px-3 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                      title="Edit Course"
                    >
                      <FaEdit size={14} />
                      <span className="text-xs">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      disabled={deletingCourseId === course._id}
                      className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                      title="Delete Course"
                    >
                      {deletingCourseId === course._id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current"/>
                      ) : (
                        <>
                          <FaTrash size={14} />
                          <span className="text-xs">Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CourseManagement;
