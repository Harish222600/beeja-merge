const Section = require('../models/section');
const SubSection = require('../models/subSection');
const Course = require('../models/course');
const Quiz = require('../models/quiz');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
const { createNewContentNotification } = require('./notification');
const { handleNewContentAddition } = require('../utils/certificateRegeneration');

// ================ Update SubSection ================
exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description, questions } = req.body;

        // validation
        if (!subSectionId) {
            return res.status(400).json({
                success: false,
                message: 'subSection ID is required to update'
            });
        }

        // find in DB
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        // add data
        if (title) {
            subSection.title = title;
        }

        if (description) {
            subSection.description = description;
        }

        // upload video to cloudinary
        if (req.file) {
            try {
                const video = req.file;
                console.log('Uploading video file (update):', video.originalname);
                
                // Check file size limit (500MB)
                const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
                if (video.size > MAX_FILE_SIZE) {
                    return res.status(400).json({
                        success: false,
                        message: 'Video file size exceeds limit of 500MB'
                    });
                }

                // Set a timeout for the entire upload process
                const uploadTimeout = setTimeout(() => {
                    throw new Error('Upload timeout exceeded');
                }, 600000); // 10 minutes

                try {
                    const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
                    
                    // Clear the timeout as upload succeeded
                    clearTimeout(uploadTimeout);

                    console.log('Video duration from Cloudinary (update):', uploadDetails.duration);
                    console.log('Full Cloudinary response (update):', JSON.stringify(uploadDetails, null, 2));
                    subSection.videoUrl = uploadDetails.secure_url;
                    subSection.timeDuration = uploadDetails.duration || 0;
                    console.log('Video uploaded successfully:', uploadDetails.secure_url);
                    console.log('Setting timeDuration to (update):', subSection.timeDuration);
                } catch (uploadError) {
                    // Clear the timeout as upload failed
                    clearTimeout(uploadTimeout);
                    throw uploadError;
                }
            } catch (uploadError) {
                console.error('Video upload failed (update):', uploadError);
                
                // Provide more detailed error messages based on error type
                let errorMessage = 'Video upload failed';
                if (uploadError.message.includes('timeout')) {
                    errorMessage = 'Video upload timed out. Please try again with a smaller file or better connection';
                } else if (uploadError.http_code === 413) {
                    errorMessage = 'Video file size too large';
                }
                
                return res.status(500).json({
                    success: false,
                    message: errorMessage,
                    error: uploadError.message,
                    details: {
                        fileName: video.originalname,
                        fileSize: video.size,
                        errorType: uploadError.name
                    }
                });
            }
        }

        // Handle quiz attachment
        if (req.body.quiz !== undefined) {
            if (req.body.quiz === '' || req.body.quiz === null) {
                // Remove quiz reference
                subSection.quiz = null;
            } else {
                // Attach existing quiz
                const quizExists = await Quiz.findById(req.body.quiz);
                if (quizExists) {
                    subSection.quiz = req.body.quiz;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Quiz not found'
                    });
                }
            }
        }

        // save data to DB
        await subSection.save();

        const updatedSection = await Section.findById(sectionId).populate("subSection");

        // Handle certificate regeneration if content was modified
        if (title || description || req.file || req.body.quiz !== undefined) {
            // Find the course that contains this section
            const course = await Course.findOne({
                courseContent: sectionId
            });

            if (course) {
                try {
                    await handleNewContentAddition(
                        course._id,
                        'lecture_update',
                        {
                            sectionId,
                            subSectionId,
                            title: subSection.title,
                            hasVideo: !!subSection.videoUrl,
                            hasQuiz: !!subSection.quiz,
                            updateType: 'modification'
                        }
                    );
                } catch (certError) {
                    console.error('Error handling certificate regeneration:', certError);
                    // Don't fail the subsection update if certificate regeneration fails
                }
            }
        }

        return res.json({
            success: true,
            data: updatedSection,
            message: "Section updated successfully",
        });
    } catch (error) {
        console.error('Error while updating the section');
        console.error(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating the section",
        });
    }
};


// ================ create SubSection ================
exports.createSubSection = async (req, res) => {
    try {
        // extract data
        const { title, description, sectionId, questions } = req.body;

        // extract video file - handle both single file and files array
        const videoFile = req.files?.videoFile?.[0] || req.file;
        console.log('req.files:', req.files);
        console.log('req.file:', req.file);

        // validation
        if (!title || !description || !sectionId) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and sectionId are required'
            });
        }

        // Validate section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: 'Section not found'
            });
        }

        let videoUrl = '';
        let timeDuration = 0;

        if (videoFile) {
            try {
                console.log('Starting video upload to Cloudinary...');
                console.log('Video file details:', {
                    originalname: videoFile.originalname,
                    mimetype: videoFile.mimetype,
                    size: videoFile.size,
                    path: videoFile.path
                });
                
                // Check file size limit (500MB)
                const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes
                if (videoFile.size > MAX_FILE_SIZE) {
                    return res.status(400).json({
                        success: false,
                        message: 'Video file size exceeds limit of 500MB'
                    });
                }

                // Check if FOLDER_NAME environment variable is set
                const folderName = process.env.FOLDER_NAME || 'course-content';
                
                // Set a timeout for the entire upload process
                const uploadTimeout = setTimeout(() => {
                    throw new Error('Upload timeout exceeded');
                }, 600000); // 10 minutes

                try {
                    // upload video to cloudinary with enhanced options
                    const videoFileDetails = await uploadImageToCloudinary(
                        videoFile, 
                        folderName
                    );
                    
                    // Clear the timeout as upload succeeded
                    clearTimeout(uploadTimeout);

                    console.log('Video uploaded successfully:', videoFileDetails.secure_url);
                    console.log('Video duration from Cloudinary:', videoFileDetails.duration);
                    console.log('Full Cloudinary response:', JSON.stringify(videoFileDetails, null, 2));
                    
                    videoUrl = videoFileDetails.secure_url;
                    // Cloudinary returns duration in seconds, we'll store it as seconds
                    timeDuration = videoFileDetails.duration || 0;
                    
                    console.log('Setting timeDuration to:', timeDuration);
                } catch (uploadError) {
                    // Clear the timeout as upload failed
                    clearTimeout(uploadTimeout);
                    throw uploadError;
                }
            } catch (uploadError) {
                console.error('Video upload failed:', uploadError);
                
                // Provide more detailed error messages based on error type
                let errorMessage = 'Video upload failed';
                if (uploadError.message.includes('timeout')) {
                    errorMessage = 'Video upload timed out. Please try again with a smaller file or better connection';
                } else if (uploadError.http_code === 413) {
                    errorMessage = 'Video file size too large';
                }
                
                return res.status(500).json({
                    success: false,
                    message: errorMessage,
                    error: uploadError.message,
                    details: {
                        fileName: videoFile.originalname,
                        fileSize: videoFile.size,
                        errorType: uploadError.name
                    }
                });
            }
        } else {
            console.log('No video file provided, creating subsection without video');
            videoUrl = null; // No video URL when no file is provided
        }

        // create entry in DB
        const SubSectionDetails = await SubSection.create({
            title, 
            timeDuration, 
            description, 
            videoUrl 
        });

        // Handle quiz attachment
        if (req.body.quiz) {
            const quizExists = await Quiz.findById(req.body.quiz);
            if (quizExists) {
                SubSectionDetails.quiz = req.body.quiz;
                await SubSectionDetails.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Quiz not found'
                });
            }
        }

        // link subsection id to section
        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection");

        // Find the course that contains this section to notify students
        const course = await Course.findOne({
            courseContent: sectionId
        });

        if (course) {
            // Notify enrolled students about new content
            await createNewContentNotification(
                course._id,
                sectionId,
                SubSectionDetails._id
            );

            // Handle certificate regeneration for students who completed the course
            try {
                await handleNewContentAddition(
                    course._id,
                    'lecture',
                    {
                        sectionId,
                        subSectionId: SubSectionDetails._id,
                        title: SubSectionDetails.title,
                        hasVideo: !!videoUrl
                    }
                );
            } catch (certError) {
                console.error('Error handling certificate regeneration:', certError);
                // Don't fail the subsection creation if certificate regeneration fails
            }
        }

        // return response
        res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection created successfully'
        });
    }
    catch (error) {
        console.log('Error while creating SubSection');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating SubSection',
            details: {
                stack: error.stack,
                name: error.name
            }
        });
    }
}






// ================ Delete SubSection ================
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )

        // delete from DB
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }

        const updatedSection = await Section.findById(sectionId).populate('subSection')

        // In frontned we have to take care - when subsection is deleted we are sending ,
        // only section data not full course details as we do in others 

        // success response
        return res.json({
            success: true,
            data: updatedSection,
            message: "SubSection deleted successfully",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,

            error: error.message,
            message: "An error occurred while deleting the SubSection",
        })
    }
}
