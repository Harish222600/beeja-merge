import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet, useParams, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

import CourseReviewModal from "../components/core/ViewCourse/CourseReviewModal"
import VideoDetailsSidebar from "../components/core/ViewCourse/VideoDetailsSidebar"
import { getFullDetailsOfCourse } from "../services/operations/courseDetailsAPI"
import {
  setCompletedLectures,
  setCourseSectionData,
  setEntireCourseData,
  setTotalNoOfLectures,
  setCompletedQuizzes,
  setPassedQuizzes,
} from "../slices/viewCourseSlice"

import { setCourseViewSidebar } from "../slices/sidebarSlice"




export default function ViewCourse() {
  const { courseId } = useParams()
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [reviewModal, setReviewModal] = useState(false)

  // get Full Details Of Course
  useEffect(() => {
    ; (async () => {
      try {
        const courseData = await getFullDetailsOfCourse(courseId, token)
        
        // Check if courseData and courseDetails exist
        if (courseData && courseData.courseDetails) {
          // console.log("Course Data here... ", courseData.courseDetails)
          dispatch(setCourseSectionData(courseData.courseDetails.courseContent))
          dispatch(setEntireCourseData(courseData.courseDetails))
          dispatch(setCompletedLectures(courseData.completedVideos || []))
          dispatch(setCompletedQuizzes(courseData.completedQuizzes || []))
          dispatch(setPassedQuizzes(courseData.passedQuizzes || []))
          
          let lectures = 0
          courseData?.courseDetails?.courseContent?.forEach((sec) => {
            lectures += sec.subSection.length
          })
          dispatch(setTotalNoOfLectures(lectures))
        } else {
          console.error("Course data not found or invalid response")
          // Handle the case where course data is not available
          dispatch(setCourseSectionData([]))
          dispatch(setEntireCourseData({}))
          dispatch(setCompletedLectures([]))
          dispatch(setCompletedQuizzes([]))
          dispatch(setPassedQuizzes([]))
          dispatch(setTotalNoOfLectures(0))
          // Navigate to dashboard if course data is not available
          navigate('/dashboard/enrolled-courses')
          toast.error("Unable to access this course")
        }
      } catch (error) {
        console.error("Error fetching course details:", error)
        // Handle error case
        dispatch(setCourseSectionData([]))
        dispatch(setEntireCourseData({}))
        dispatch(setCompletedLectures([]))
        dispatch(setCompletedQuizzes([]))
        dispatch(setPassedQuizzes([]))
        dispatch(setTotalNoOfLectures(0))
        // Navigate to dashboard on error
        navigate('/dashboard/enrolled-courses')
        toast.error(error?.response?.data?.message || "Error loading course")
      }
    })()

  }, [courseId, token, navigate])


  // handle sidebar for small devices
  const { courseViewSidebar } = useSelector(state => state.sidebar)
  const [screenSize, setScreenSize] = useState(undefined)

  // set curr screen Size
  useEffect(() => {
    const handleScreenSize = () => setScreenSize(window.innerWidth)

    window.addEventListener('resize', handleScreenSize);
    handleScreenSize();
    return () => window.removeEventListener('resize', handleScreenSize);
  })

  // close / open sidebar according screen size
  useEffect(() => {
    if (screenSize <= 640) {
      dispatch(setCourseViewSidebar(false))
    } else dispatch(setCourseViewSidebar(true))
  }, [screenSize])


  return (
    <>
      <div className="relative flex min-h-[calc(100vh-3.5rem)] ">
        {/* view course side bar */}
        {courseViewSidebar && <VideoDetailsSidebar setReviewModal={setReviewModal} />}

        <div className="h-[calc(100vh-3.5rem)] flex-1 overflow-auto mt-14">
          <div className="mx-6">
            <Outlet />
          </div>
        </div>
      </div>


      {reviewModal && <CourseReviewModal setReviewModal={setReviewModal} />}
    </>
  )
}
