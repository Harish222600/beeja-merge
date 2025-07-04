import React, { useEffect, useState } from "react"
import ReactStars from "react-rating-stars-component"
import Img from './Img';

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react"
// Import Swiper styles
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"

// Icons
import { FaStar } from "react-icons/fa"

// Get apiFunction and the endpoint
import { apiConnector } from "../../services/apiConnector";
import { ratingsEndpoints } from "../../services/apis"

function ReviewSlider() {
  const [reviews, setReviews] = useState(null)

  useEffect(() => {
    ; (async () => {
      const { data } = await apiConnector(
        "GET",
        ratingsEndpoints.REVIEWS_DETAILS_API
      )
      if (data?.success) {
        setReviews(data?.data)
      }
    })()
  }, [])

  if(!reviews) return;

  return (
    <div className="text-white ">
      <div className="my-[30px] h-[140px] max-w-maxContentTab lg:max-w-maxContent px-2 "  >
        <Swiper
          breakpoints={{
            320: {
              slidesPerView: 1.2,
              spaceBetween: 10,
            },
            480: {
              slidesPerView: 2.2,
              spaceBetween: 12,
            },
            640: {
              slidesPerView: 2.5,
              spaceBetween: 15,
            },
            768: {
              slidesPerView: 3.2,
              spaceBetween: 18,
            },
            1024: {
              slidesPerView: 4.5,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 5.5,
              spaceBetween: 22,
            },
          }}
          loop={true}
          freeMode={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          className="w-full"
        >
          {reviews.map((review, i) => {
            return (
              <SwiperSlide key={i}>
                <div className="flex flex-col gap-2 bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-3 text-[11px] h-[120px] rounded-lg border border-blue-500/20 hover:border-yellow-50/50 transition-all duration-200 group backdrop-blur-sm">
                  {/* Header with user info */}
                  <div className="flex items-start gap-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-7 h-7 rounded-md overflow-hidden border border-richblack-600">
                        <Img
                          src={
                            review?.user?.image
                              ? review?.user?.image
                              : `https://api.dicebear.com/5.x/initials/svg?seed=${review?.user?.firstName} ${review?.user?.lastName}`
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h1 className="font-semibold text-[11px] text-white capitalize truncate pr-1">{`${review?.user?.firstName} ${review?.user?.lastName}`}</h1>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-yellow-100 text-[9px] font-medium">{review.rating}</span>
                          <ReactStars
                            count={5}
                            value={parseInt(review.rating)}
                            size={8}
                            edit={false}
                            activeColor="#FFD700"
                            emptyIcon={<FaStar />}
                            fullIcon={<FaStar />}
                          />
                        </div>
                      </div>
                      <h2 className="text-[9px] font-medium text-richblack-300 truncate">
                        {review?.course?.courseName}
                      </h2>
                    </div>
                  </div>

                  {/* Review text */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] text-richblack-100 leading-relaxed line-clamp-4">
                      {review?.review.length > 80 
                        ? `${review?.review.substring(0, 80)}...`
                        : review?.review}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

export default ReviewSlider
