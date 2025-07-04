import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { FaInfoCircle, FaTools } from "react-icons/fa";
import { showAllCategories } from "../../../services/operations/categoryAPI";
import { getAllInstructors } from "../../../services/operations/adminAPI";
import { editCourseDetails } from "../../../services/operations/courseDetailsAPI";
import Upload from "../../../components/core/Dashboard/AddCourse/Upload";
import ChipInput from "../../../components/core/Dashboard/AddCourse/CourseInformation/ChipInput";
import RequirementsField from "../../../components/core/Dashboard/AddCourse/CourseInformation/RequirementField";
import AdminCourseBuilder from "./AdminCourseBuilder";

export default function EditCourse({ course, onCancel, onSave }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [activeTab, setActiveTab] = useState('information');
  const [currentCourse, setCurrentCourse] = useState(course);

  useEffect(() => {
    const getCategories = async () => {
      const categories = await showAllCategories();
      setCategories(categories);
    };

    const getInstructors = async () => {
      const instructorsData = await getAllInstructors(token);
      if (instructorsData) {
        setInstructors(instructorsData);
      }
    };

    // Pre-populate form with course data
    if (course) {
      setCurrentCourse(course);
      setValue("courseTitle", course.courseName);
      setValue("courseShortDesc", course.courseDescription);
      setValue("coursePrice", course.price);
      setValue("courseCategory", course.category?._id);
      setValue("courseTags", course.tag || []);
      setValue("courseBenefits", course.whatYouWillLearn);
      setValue("courseRequirements", course.instructions || []);
      setValue("courseImage", course.thumbnail);
      if (course.instructor) {
        setValue("instructorId", course.instructor._id);
      }
    }

    getCategories();
    getInstructors();
  }, [course, setValue, token]);

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      console.log("Form data before processing:", data);
      console.log("Original course data:", course);
      
      const formData = new FormData();
      formData.append("courseId", course._id);
      
      // Only append changed fields
      if (data.courseTitle !== course.courseName) {
        formData.append("courseName", data.courseTitle);
        console.log("Course name changed:", data.courseTitle);
      }
      if (data.courseShortDesc !== course.courseDescription) {
        formData.append("courseDescription", data.courseShortDesc);
        console.log("Course description changed");
      }
      if (data.coursePrice !== course.price) {
        formData.append("price", data.coursePrice);
        console.log("Course price changed:", data.coursePrice);
      }
      if (data.courseCategory !== course.category?._id) {
        formData.append("category", data.courseCategory);
        console.log("Course category changed:", data.courseCategory);
      }
      if (JSON.stringify(data.courseTags) !== JSON.stringify(course.tag)) {
        formData.append("tag", JSON.stringify(data.courseTags));
        console.log("Course tags changed:", data.courseTags);
      }
      if (data.courseBenefits !== course.whatYouWillLearn) {
        formData.append("whatYouWillLearn", data.courseBenefits);
        console.log("Course benefits changed");
      }
      if (JSON.stringify(data.courseRequirements) !== JSON.stringify(course.instructions)) {
        formData.append("instructions", JSON.stringify(data.courseRequirements));
        console.log("Course requirements changed:", data.courseRequirements);
      }
      // Handle thumbnail image update
      if (data.courseImage && data.courseImage !== course.thumbnail) {
        if (data.courseImage instanceof File) {
          formData.append("thumbnailImage", data.courseImage);
          console.log("Appending thumbnail file:", data.courseImage.name);
        }
      }
      if (data.instructorId !== course.instructor?._id) {
        formData.append("instructorId", data.instructorId);
        console.log("Instructor changed:", data.instructorId);
      }

      // Log FormData contents
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const result = await editCourseDetails(formData, token);
      
      if (result) {
        toast.success("Course updated successfully!");
        setCurrentCourse(result);
        onSave(result); // Callback to refresh course list
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle course update from Course Builder
  const handleCourseUpdate = (updatedCourse) => {
    setCurrentCourse(updatedCourse);
    onSave(updatedCourse);
  };

  return (
    <div className="space-y-8 rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-richblack-5">Edit Course</h2>
        <button
          onClick={onCancel}
          className="text-richblack-300 hover:text-richblack-5 px-4 py-2 rounded-lg border border-richblack-600 hover:border-richblack-500 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Tab Navigation - Improved for mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-1 bg-richblack-700 p-2 rounded-lg">
        <button
          onClick={() => setActiveTab('information')}
          className={`py-3 sm:py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'information'
              ? 'bg-yellow-50 text-richblack-900'
              : 'text-richblack-5 hover:text-yellow-50'
          } flex-1 flex items-center justify-center gap-2`}
        >
          <FaInfoCircle className="text-base" />
          <span>Course Information</span>
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`py-3 sm:py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'builder'
              ? 'bg-yellow-50 text-richblack-900'
              : 'text-richblack-5 hover:text-yellow-50'
          } flex-1 flex items-center justify-center gap-2`}
        >
          <FaTools className="text-base" />
          <span>Course Builder</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'information' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Course Title */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="courseTitle">
            Course Title <sup className="text-pink-200">*</sup>
          </label>
          <input
            id="courseTitle"
            placeholder="Enter Course Title"
            {...register("courseTitle", { required: "Course title is required" })}
            className="form-style w-full"
          />
          {errors.courseTitle && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {errors.courseTitle.message}
            </span>
          )}
        </div>

        {/* Course Short Description */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="courseShortDesc">
            Course Short Description <sup className="text-pink-200">*</sup>
          </label>
          <textarea
            id="courseShortDesc"
            placeholder="Enter Description"
            {...register("courseShortDesc", { required: "Course description is required" })}
            className="form-style resize-x-none min-h-[130px] w-full"
          />
          {errors.courseShortDesc && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {errors.courseShortDesc.message}
            </span>
          )}
        </div>

        {/* Course Price */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="coursePrice">
            Course Price <sup className="text-pink-200">*</sup>
          </label>
          <div className="relative">
            <input
              id="coursePrice"
              placeholder="Enter Course Price"
              {...register("coursePrice", {
                required: "Course price is required",
                valueAsNumber: true,
                pattern: {
                  value: /^(0|[1-9]\d*)(\.\d+)?$/,
                  message: "Please enter a valid price"
                },
              })}
              className="form-style w-full !pl-12"
            />
            <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 inline-block -translate-y-1/2 text-2xl text-richblack-400" />
          </div>
          {errors.coursePrice && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {errors.coursePrice.message}
            </span>
          )}
        </div>

        {/* Course Category */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="courseCategory">
            Course Category <sup className="text-pink-200">*</sup>
          </label>
          <select
            {...register("courseCategory", { required: "Course category is required" })}
            id="courseCategory"
            className="form-style w-full cursor-pointer"
          >
            <option value="" disabled>
              Choose a Category
            </option>
            {categories?.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.courseCategory && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {errors.courseCategory.message}
            </span>
          )}
        </div>

        {/* Course Tags */}
        <ChipInput
          label="Tags"
          name="courseTags"
          placeholder="Enter Tags and press Enter or Comma"
          register={register}
          errors={errors}
          setValue={setValue}
        />

        {/* Course Thumbnail Image */}
        <Upload
          name="courseImage"
          label="Course Thumbnail"
          register={register}
          setValue={setValue}
          errors={errors}
          editData={course?.thumbnail}
        />

        {/* Benefits of the course */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="courseBenefits">
            Benefits of the course <sup className="text-pink-200">*</sup>
          </label>
          <textarea
            id="courseBenefits"
            placeholder="Enter benefits of the course"
            {...register("courseBenefits", { required: "Course benefits are required" })}
            className="form-style resize-x-none min-h-[130px] w-full"
          />
          {errors.courseBenefits && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {errors.courseBenefits.message}
            </span>
          )}
        </div>

        {/* Requirements/Instructions */}
        <RequirementsField
          name="courseRequirements"
          label="Requirements/Instructions"
          register={register}
          setValue={setValue}
          errors={errors}
        />

        {/* Select Instructor */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-richblack-5" htmlFor="instructorId">
            Select Instructor <sup className="text-pink-200">*</sup>
          </label>
          <select
            id="instructorId"
            {...register("instructorId", { required: "Instructor selection is required" })}
            className="form-style w-full cursor-pointer"
          >
            <option value="" disabled>
              Choose an Instructor
            </option>
            {instructors?.map((instructor) => (
              <option key={instructor._id} value={instructor._id}>
                {instructor.firstName} {instructor.lastName}
              </option>
            ))}
          </select>
          {errors.instructorId && (
            <span className="ml-2 text-xs tracking-wide text-pink-200">
              {errors.instructorId.message}
            </span>
          )}
        </div>

          {/* Submit Button - Improved for mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center rounded-lg bg-richblack-600 px-6 py-3.5 text-richblack-5 font-semibold hover:bg-richblack-700 transition-all duration-200 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center rounded-lg bg-yellow-50 px-6 py-3.5 text-richblack-900 font-semibold w-full sm:flex-1 ${
                loading ? "cursor-not-allowed opacity-50" : "hover:scale-[0.98] active:scale-95"
              } transition-all duration-200`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-richblack-900 rounded-full animate-spin mr-2"></div>
                  Updating Course...
                </>
              ) : (
                "Update Course"
              )}
            </button>
          </div>
        </form>
      ) : (
        <AdminCourseBuilder
          course={currentCourse}
          onCourseUpdate={handleCourseUpdate}
        />
      )}
    </div>
  );
}
