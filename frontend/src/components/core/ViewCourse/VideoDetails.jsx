import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation } from "react-router-dom"
import { useNavigate, useParams } from "react-router-dom"

import "video-react/dist/video-react.css"
import { BigPlayButton, Player } from "video-react"

import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI"
import { updateCompletedLectures } from "../../../slices/viewCourseSlice"
import { setCourseViewSidebar } from "../../../slices/sidebarSlice"
import { apiConnector } from "../../../services/apiConnector"
import { endpoints } from "../../../services/apis"

import IconBtn from "../../common/IconBtn"

import { HiMenuAlt1 } from 'react-icons/hi'


const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams()

  const navigate = useNavigate()
  const location = useLocation()
  const playerRef = useRef(null)
  const dispatch = useDispatch()

  const { token } = useSelector((state) => state.auth)
  const { courseSectionData, courseEntireData, completedLectures } = useSelector((state) => state.viewCourse)

  const [videoData, setVideoData] = useState([])
  const [previewSource, setPreviewSource] = useState("")
  const [videoEnded, setVideoEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [watchTime, setWatchTime] = useState(0)
  const watchTimeRef = useRef(0)
  const lastUpdateTime = useRef(Date.now())

  // Update watch time every 30 seconds
  const updateWatchTime = useCallback(async () => {
    if (watchTimeRef.current > 0) {
      try {
        await apiConnector("POST", endpoints.UPDATE_WATCH_TIME_API, {
          courseId,
          subSectionId,
          watchTime: Math.floor(watchTimeRef.current)
        }, {
          Authorization: `Bearer ${token}`
        })
        watchTimeRef.current = 0
      } catch (error) {
        console.error("Error updating watch time:", error)
      }
    }
  }, [courseId, subSectionId, token])

  // Handle time update from video player
  const handleTimeUpdate = useCallback(() => {
    if (!playerRef.current) return
    
    const currentTime = Date.now()
    const timeDiff = currentTime - lastUpdateTime.current
    
    // Update every second
    if (timeDiff >= 1000) {
      const newWatchTime = watchTimeRef.current + (timeDiff / 1000)
      watchTimeRef.current = newWatchTime
      setWatchTime(newWatchTime)
      lastUpdateTime.current = currentTime
      
      // Send update every 30 seconds
      if (newWatchTime >= 30) {
        updateWatchTime()
      }
    }
  }, [updateWatchTime])

  // Update watch time when component unmounts
  useEffect(() => {
    return () => {
      updateWatchTime()
    }
  }, [updateWatchTime])

  // Memoized video data calculation
  const currentVideoData = useMemo(() => {
    if (!courseSectionData.length || !sectionId || !subSectionId) return null
    
    const currentSection = courseSectionData.find(course => course._id === sectionId)
    if (!currentSection) return null
    
    const currentSubSection = currentSection.subSection.find(data => data._id === subSectionId)
    return currentSubSection || null
  }, [courseSectionData, sectionId, subSectionId])

  useEffect(() => {
    if (!courseId && !sectionId && !subSectionId) {
      navigate(`/dashboard/enrolled-courses`)
      return
    }

    if (currentVideoData) {
      setVideoData(currentVideoData)
      if (courseEntireData?.thumbnail) {
        setPreviewSource(courseEntireData.thumbnail)
      }
    }
    setVideoEnded(false)
  }, [currentVideoData, courseEntireData, courseId, sectionId, subSectionId, navigate])

  // Memoized check if the lecture is the first video of the course
  const isFirstVideo = useMemo(() => {
    if (!courseSectionData.length) return false
    
    const currentSectionIndx = courseSectionData.findIndex((data) => data._id === sectionId)
    if (currentSectionIndx === -1) return false
    
    const currentSubSectionIndx = courseSectionData[currentSectionIndx].subSection.findIndex((data) => data._id === subSectionId)
    
    return currentSectionIndx === 0 && currentSubSectionIndx === 0
  }, [courseSectionData, sectionId, subSectionId])

  // Memoized navigation functions
  const goToNextVideo = useCallback(() => {
    const currentSectionIndx = courseSectionData.findIndex((data) => data._id === sectionId)
    if (currentSectionIndx === -1) return

    const noOfSubsections = courseSectionData[currentSectionIndx].subSection.length
    const currentSubSectionIndx = courseSectionData[currentSectionIndx].subSection.findIndex((data) => data._id === subSectionId)

    if (currentSubSectionIndx !== noOfSubsections - 1) {
      const nextSubSectionId = courseSectionData[currentSectionIndx].subSection[currentSubSectionIndx + 1]._id
      navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${nextSubSectionId}`)
    } else if (currentSectionIndx < courseSectionData.length - 1) {
      const nextSectionId = courseSectionData[currentSectionIndx + 1]._id
      const nextSubSectionId = courseSectionData[currentSectionIndx + 1].subSection[0]._id
      navigate(`/view-course/${courseId}/section/${nextSectionId}/sub-section/${nextSubSectionId}`)
    }
  }, [courseSectionData, sectionId, subSectionId, courseId, navigate])

  // Memoized check if the lecture is the last video of the course
  const isLastVideo = useMemo(() => {
    if (!courseSectionData.length) return false
    
    const currentSectionIndx = courseSectionData.findIndex((data) => data._id === sectionId)
    if (currentSectionIndx === -1) return false
    
    const noOfSubsections = courseSectionData[currentSectionIndx].subSection.length
    const currentSubSectionIndx = courseSectionData[currentSectionIndx].subSection.findIndex((data) => data._id === subSectionId)

    return currentSectionIndx === courseSectionData.length - 1 && currentSubSectionIndx === noOfSubsections - 1
  }, [courseSectionData, sectionId, subSectionId])

  const goToPrevVideo = useCallback(() => {
    const currentSectionIndx = courseSectionData.findIndex((data) => data._id === sectionId)
    if (currentSectionIndx === -1) return

    const currentSubSectionIndx = courseSectionData[currentSectionIndx].subSection.findIndex((data) => data._id === subSectionId)

    if (currentSubSectionIndx !== 0) {
      const prevSubSectionId = courseSectionData[currentSectionIndx].subSection[currentSubSectionIndx - 1]._id
      navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${prevSubSectionId}`)
    } else if (currentSectionIndx > 0) {
      const prevSectionId = courseSectionData[currentSectionIndx - 1]._id
      const prevSubSectionLength = courseSectionData[currentSectionIndx - 1].subSection.length
      const prevSubSectionId = courseSectionData[currentSectionIndx - 1].subSection[prevSubSectionLength - 1]._id
      navigate(`/view-course/${courseId}/section/${prevSectionId}/sub-section/${prevSubSectionId}`)
    }
  }, [courseSectionData, sectionId, subSectionId, courseId, navigate])

  // Memoized lecture completion handler
  const handleLectureCompletion = useCallback(async () => {
    setLoading(true)
    try {
      const res = await markLectureAsComplete(
        { courseId: courseId, subsectionId: subSectionId },
        token
      )
      if (res) {
        dispatch(updateCompletedLectures(subSectionId))
      }
    } catch (error) {
      console.error("Error marking lecture as complete:", error)
    } finally {
      setLoading(false)
    }
  }, [courseId, subSectionId, token, dispatch])

  const { courseViewSidebar } = useSelector(state => state.sidebar)

  // this will hide course video , title , desc, if sidebar is open in small device
  // for good looking i have try this 
  if (courseViewSidebar && window.innerWidth <= 640) return;

  return (
    <div className="flex flex-col gap-5 text-white">

      {/* open - close side bar icons */}
      <div className="sm:hidden text-white absolute left-7 top-3 cursor-pointer " onClick={() => dispatch(setCourseViewSidebar(!courseViewSidebar))}>
        {
          !courseViewSidebar && <HiMenuAlt1 size={33} />
        }
      </div>


      {!videoData ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-richblack-800 rounded-md">
          <div className="animate-pulse">
            <div className="h-4 w-48 bg-richblack-700 rounded mb-4"></div>
            <div className="h-2 w-32 bg-richblack-700 rounded"></div>
          </div>
        </div>
      ) : !videoData.videoUrl ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-richblack-800 rounded-md">
          <div className="text-center">
            <p className="text-richblack-200 text-lg mb-2">No video available for this lecture</p>
            <p className="text-richblack-400 text-sm">Please proceed to the next section or check back later.</p>
          </div>
        </div>
      ) : (
        <Player
          ref={playerRef}
          aspectRatio="16:9"
          playsInline
          autoPlay
          onEnded={() => {
            setVideoEnded(true)
            updateWatchTime()
          }}
          onTimeUpdate={() => {
            if (playerRef.current) {
              const currentTime = playerRef.current.getState().player.currentTime;
              const timeDiff = currentTime - (watchTimeRef.current || 0);
              if (timeDiff >= 1) { // Update every second
                watchTimeRef.current = currentTime;
                setWatchTime(currentTime);
                
                // Send update every 30 seconds
                if (Math.floor(currentTime) % 30 === 0) {
                  updateWatchTime();
                }
              }
            }
          }}
          src={videoData.videoUrl}
        >
          <BigPlayButton position="center" />
          {/* Render When Video Ends */}
          {videoEnded && (
            <div
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.1))",
              }}
              className="w-full absolute inset-0 z-[100] grid h-full place-content-center font-inter"
            >
              {!completedLectures.includes(subSectionId) && (
                <IconBtn
                  disabled={loading}
                  onClick={() => handleLectureCompletion()}
                  text={!loading ? "Mark As Completed" : "Loading..."}
                  customClasses="text-xl max-w-max px-4 mx-auto"
                />
              )}
              
              {/* Show Take Quiz button if lecture is completed and has quiz */}
              {completedLectures.includes(subSectionId) && videoData?.quiz && (
                <IconBtn
                  disabled={loading}
                  onClick={() => navigate(`/view-course/${courseId}/section/${sectionId}/sub-section/${subSectionId}/quiz`)}
                  text="Take Quiz"
                  customClasses="text-xl max-w-max px-4 mx-auto bg-green-600 hover:bg-green-700"
                />
              )}
              
              <IconBtn
                disabled={loading}
                onClick={() => {
                  if (playerRef?.current) {
                    // set the current time of the video to 0
                    playerRef?.current?.seek(0)
                    setVideoEnded(false)
                  }
                }}
                text="Rewatch"
                customClasses="text-xl max-w-max px-4 mx-auto mt-2"
              />

              <div className="mt-10 flex min-w-[250px] justify-center gap-x-4 text-xl">
              {!isFirstVideo && (
                <button
                  disabled={loading}
                  onClick={goToPrevVideo}
                  className="blackButton"
                >
                  Prev
                </button>
              )}
              {!isLastVideo && (
                <button
                  disabled={loading}
                  onClick={goToNextVideo}
                  className="blackButton"
                >
                  {isLastVideo ? "Go to Course" : "Next"}
                </button>
              )}
              </div>
            </div>
          )}
        </Player>
      )}

      <h1 className="mt-4 text-3xl font-semibold">{videoData?.title}</h1>
      <p className="pt-2 pb-6">{videoData?.description}</p>
    </div>
  )
}

export default VideoDetails
