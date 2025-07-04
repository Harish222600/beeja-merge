import { useEffect, useRef, useState } from "react"
import { useDropzone } from "react-dropzone"
import { FiUploadCloud } from "react-icons/fi"
import { useSelector } from "react-redux"

// Removed video-react to eliminate legacy context API warning



export default function Upload({ name, label, register, setValue, errors, video = false, viewData = null, editData = null, setImageFile = null }) {
  // const { course } = useSelector((state) => state.course)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSource, setPreviewSource] = useState(viewData ? viewData : editData ? editData : "")
  const inputRef = useRef(null)

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      previewFile(file)
      setSelectedFile(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: !video
      ? { "image/*": [".jpeg", ".jpg", ".png"] }
      : { "video/*": [".mp4"] },
    onDrop,
  })

  const previewFile = (file) => {
    // console.log(file)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      setPreviewSource(reader.result)
    }
  }

  useEffect(() => {
    register(name, { required: !video }) // Make video upload optional
  }, [register, video])


  useEffect(() => {
    if (selectedFile) {
      setValue(name, selectedFile)
      if (setImageFile) {
        setImageFile(selectedFile)
      }
      console.log("Selected file:", {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      })
    }
  }, [selectedFile, setValue, name, setImageFile])

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-richblack-5" htmlFor={name}>
        {label} {!viewData && !video && <sup className="text-pink-200">*</sup>}
        {video && <span className="text-xs text-richblack-300 ml-2">(optional)</span>}
      </label>

      <div
        className={`${
          isDragActive ? "border-yellow-50 bg-richblack-600" : "border-richblack-500 bg-richblack-700"
        } relative flex min-h-[200px] cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-all duration-200 hover:border-yellow-50`}
      >
        {previewSource ? (
          <div className="flex w-full flex-col p-4 md:p-6">
            {!video ? (
              <img
                src={previewSource}
                alt="Preview"
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <div className="relative aspect-video w-full">
                <video 
                  className="h-full w-full rounded-md object-cover" 
                  controls
                  playsInline 
                  src={previewSource}
                >
                  Your browser does not support the video tag.
                </video>
                {selectedFile && (
                  <div className="absolute bottom-2 right-2 rounded bg-richblack-800 px-2 py-1 text-xs text-richblack-50">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}
              </div>
            )}

            {!viewData && (
              <button
                type="button"
                onClick={() => {
                  setPreviewSource("")
                  setSelectedFile(null)
                  setValue(name, null)
                }}
                className="mt-3 text-sm font-medium text-richblack-400 underline hover:text-yellow-50"
              >
                Remove {video ? "Video" : "Image"}
              </button>
            )}
          </div>
        ) : (
          <div
            className="flex w-full flex-col items-center p-4 md:p-6"
            {...getRootProps()}
          >
            <input {...getInputProps()} ref={inputRef} />
            <div className="grid aspect-square w-14 place-items-center rounded-full bg-richblack-800 transition-all duration-200 hover:bg-richblack-700">
              <FiUploadCloud className="text-2xl text-yellow-50" />
            </div>
            <p className="mt-2 max-w-[200px] text-center text-sm text-richblack-200">
              Drag and drop {!video ? "an image" : "a video"}, or{" "}
              <span className="font-semibold text-yellow-50 cursor-pointer">browse</span>
            </p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-richblack-200">
              {video ? (
                <>
                  <li className="flex items-center gap-1">
                    <span>•</span> Max size: 100MB
                  </li>
                  <li className="flex items-center gap-1">
                    <span>•</span> Format: MP4
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-1">
                    <span>•</span> Aspect ratio 16:9
                  </li>
                  <li className="flex items-center gap-1">
                    <span>•</span> Recommended: 1024x576
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      {errors[name] && (
        <span className="flex items-center text-xs text-pink-200">
          <span className="mr-1">⚠️</span>
          {label} is required
        </span>
      )}
    </div>
  )
}