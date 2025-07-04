const Certificate = require("../models/certificate");
const Course = require("../models/course");
const User = require("../models/user");
const CourseProgress = require("../models/courseProgress");

/**
 * Regenerate certificates for a specific course
 * @param {string} courseId - The course ID to regenerate certificates for
 * @param {string} triggerType - Type of trigger ('manual' or 'automatic')
 * @returns {Object} - Result object with regeneration details
 */
const regenerateCertificatesForCourse = async (courseId, triggerType = 'manual') => {
  try {
    console.log(`Starting certificate regeneration for course: ${courseId}, trigger: ${triggerType}`);

    // Check if course exists
    const course = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        populate: {
          path: "quiz"
        }
      }
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Calculate total course items (videos + quizzes)
    let totalCourseItems = 0;
    course.courseContent?.forEach((section) => {
      section.subSection?.forEach((subsection) => {
        totalCourseItems += 1; // video
        if (subsection.quiz) {
          totalCourseItems += 1; // quiz
        }
      });
    });

    // Find all existing certificates for this course
    const existingCertificates = await Certificate.find({ courseId })
      .populate('userId', 'firstName lastName email');

    const results = [];
    let regeneratedCount = 0;
    let invalidatedCount = 0;

    // Process each existing certificate
    for (const certificate of existingCertificates) {
      try {
        const userId = certificate.userId._id;
        
        // Check current course progress
        const courseProgress = await CourseProgress.findOne({
          courseID: courseId,
          userId: userId,
        });

        let currentProgress = 0;
        let completedItems = 0;
        
        if (courseProgress) {
          completedItems = courseProgress.completedVideos.length + courseProgress.completedQuizzes.length;
          currentProgress = totalCourseItems > 0 ? (completedItems / totalCourseItems) * 100 : 0;
          
          // Round to 2 decimal places
          const multiplier = Math.pow(10, 2);
          currentProgress = Math.round(currentProgress * multiplier) / multiplier;
        }

        const studentName = `${certificate.userId.firstName} ${certificate.userId.lastName}`;
        
        if (currentProgress >= 100) {
          // Student still has 100% completion - regenerate certificate
          certificate.issuedDate = new Date();
          certificate.completionDate = new Date();
          await certificate.save();
          
          regeneratedCount++;
          results.push({
            certificateId: certificate.certificateId,
            studentName,
            email: certificate.userId.email,
            action: 'regenerated',
            currentProgress,
            message: 'Certificate regenerated - course still completed'
          });
          
          console.log(`Certificate regenerated for ${studentName} (${certificate.certificateId})`);
        } else {
          // Student no longer has 100% completion - mark as invalid but don't delete
          // This preserves the certificate record for audit purposes
          results.push({
            certificateId: certificate.certificateId,
            studentName,
            email: certificate.userId.email,
            action: 'invalidated',
            currentProgress,
            message: `Certificate no longer valid - current progress: ${currentProgress}%`
          });
          
          invalidatedCount++;
          console.log(`Certificate invalidated for ${studentName} (${certificate.certificateId}) - Progress: ${currentProgress}%`);
        }
      } catch (error) {
        console.error(`Error processing certificate ${certificate.certificateId}:`, error);
        results.push({
          certificateId: certificate.certificateId,
          studentName: certificate.userId ? `${certificate.userId.firstName} ${certificate.userId.lastName}` : 'Unknown',
          action: 'error',
          message: `Error processing certificate: ${error.message}`
        });
      }
    }

    const result = {
      success: true,
      courseId,
      courseName: course.courseName,
      triggerType,
      totalCertificates: existingCertificates.length,
      regeneratedCount,
      invalidatedCount,
      totalCourseItems,
      message: `Certificate regeneration completed. ${regeneratedCount} regenerated, ${invalidatedCount} invalidated out of ${existingCertificates.length} total certificates.`,
      results
    };

    console.log(`Certificate regeneration completed for course ${courseId}:`, {
      total: existingCertificates.length,
      regenerated: regeneratedCount,
      invalidated: invalidatedCount
    });

    return result;

  } catch (error) {
    console.error(`Error in certificate regeneration for course ${courseId}:`, error);
    throw new Error(`Certificate regeneration failed: ${error.message}`);
  }
};

/**
 * Check if certificates need regeneration for a course
 * @param {string} courseId - The course ID to check
 * @returns {Object} - Status object with regeneration needs
 */
const checkCertificateRegenerationNeeds = async (courseId) => {
  try {
    const course = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
        populate: {
          path: "quiz"
        }
      }
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Calculate total course items
    let totalCourseItems = 0;
    course.courseContent?.forEach((section) => {
      section.subSection?.forEach((subsection) => {
        totalCourseItems += 1; // video
        if (subsection.quiz) {
          totalCourseItems += 1; // quiz
        }
      });
    });

    const certificates = await Certificate.find({ courseId })
      .populate('userId', 'firstName lastName email');

    const needsRegeneration = [];
    const validCertificates = [];

    for (const certificate of certificates) {
      const courseProgress = await CourseProgress.findOne({
        courseID: courseId,
        userId: certificate.userId._id,
      });

      let currentProgress = 0;
      if (courseProgress) {
        const completedItems = courseProgress.completedVideos.length + courseProgress.completedQuizzes.length;
        currentProgress = totalCourseItems > 0 ? (completedItems / totalCourseItems) * 100 : 0;
        currentProgress = Math.round(currentProgress * 100) / 100;
      }

      const certificateData = {
        certificateId: certificate.certificateId,
        studentName: `${certificate.userId.firstName} ${certificate.userId.lastName}`,
        email: certificate.userId.email,
        currentProgress,
        issuedDate: certificate.issuedDate,
        lastUpdated: certificate.updatedAt
      };

      if (currentProgress >= 100) {
        validCertificates.push(certificateData);
      } else {
        needsRegeneration.push({
          ...certificateData,
          reason: `Progress dropped to ${currentProgress}%`
        });
      }
    }

    return {
      courseId,
      courseName: course.courseName,
      totalCertificates: certificates.length,
      validCertificates: validCertificates.length,
      needsRegeneration: needsRegeneration.length,
      totalCourseItems,
      details: {
        valid: validCertificates,
        needsRegeneration
      }
    };

  } catch (error) {
    console.error(`Error checking certificate regeneration needs for course ${courseId}:`, error);
    throw new Error(`Failed to check certificate status: ${error.message}`);
  }
};

module.exports = {
  regenerateCertificatesForCourse,
  checkCertificateRegenerationNeeds
};
