const Category = require('../models/category')
const Course = require('../models/course')
const { convertSecondsToDuration } = require("../utils/secToDuration")

// get Random Integer
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

// Helper function to calculate average rating
function calculateAverageRating(ratingAndReviews) {
    if (!ratingAndReviews || ratingAndReviews.length === 0) {
        return { averageRating: 0, totalRatings: 0 };
    }
    
    const totalRating = ratingAndReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / ratingAndReviews.length;
    
    return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings: ratingAndReviews.length
    };
}

// ================ delete Category ================
exports.deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;

        // validation
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has courses
        if (category.courses && category.courses.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that has courses. Please remove all courses from this category first.'
            });
        }

        // Delete category
        await Category.findByIdAndDelete(categoryId);

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.log('Error while deleting Category');
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error while deleting Category',
            error: error.message
        });
    }
}

// ================ create Category ================
// Update Category
exports.updateCategory = async (req, res) => {
    try {
        const { categoryId, name, description, icon } = req.body;

        // validation
        if (!categoryId || !name || !description) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if new name already exists (excluding current category)
        const existingCategory = await Category.findOne({ 
            _id: { $ne: categoryId },
            name: name.trim() 
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        // Update category
        category.name = name.trim();
        category.description = description.trim();
        category.icon = icon || "";
        await category.save();

        res.status(200).json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    }
    catch (error) {
        console.log('Error while updating Category');
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error while updating Category',
            error: error.message
        });
    }
}

exports.createCategory = async (req, res) => {
    try {
        // extract data
        const { name, description, icon, previewImage } = req.body;

        // validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'Name and description are required'
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const categoryDetails = await Category.create({
            name: name.trim(),
            description: description.trim(),
            icon: icon || "",
            previewImage: previewImage || ""
        });

        res.status(200).json({
            success: true,
            data: categoryDetails,
            message: 'Category created successfully'
        });
    }
    catch (error) {
        console.log('Error while creating Category');
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Error while creating Category',
            error: error.message
        })
    }
}


// ================ get All Category ================
exports.showAllCategories = async (req, res) => {
    try {
        console.log('Fetching all categories from database...');
        
        // get all category from DB with courses populated
        const allCategories = await Category.find({})
            .populate({
                path: 'courses',
                match: { status: 'Published', isVisible: true },
                select: '_id courseName'
            })
            .select('name description icon courses');
        
        console.log(`Found ${allCategories.length} categories`);

        if (!allCategories) {
            console.log('No categories found in database');
            return res.status(404).json({
                success: false,
                message: 'No categories found'
            });
        }

        // return response
        res.status(200).json({
            success: true,
            data: allCategories,
            message: 'Categories fetched successfully'
        });
    }
    catch (error) {
        console.error('Error while fetching categories:', {
            message: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            success: false,
            message: 'Error while fetching categories',
            error: error.message
        });
    }
}



exports.getCategoryPageDetails = async (req, res) => {
    try {
        console.log('=== getCategoryPageDetails START ===');
        const { categoryId } = req.body;
        console.log('Request categoryId:', categoryId);

        if (!categoryId) {
            console.log('ERROR: No categoryId provided');
            return res.status(400).json({ 
                success: false, 
                message: "Category ID is required" 
            });
        }

        // First get the category
        console.log('Fetching category with ID:', categoryId);
        const selectedCategory = await Category.findById(categoryId).lean();

        if (!selectedCategory) {
            console.log('ERROR: Category not found for ID:', categoryId);
            return res.status(404).json({ 
                success: false, 
                message: "Category not found" 
            });
        }

        console.log('Selected category found:', {
            id: selectedCategory._id,
            name: selectedCategory.name,
            coursesCount: selectedCategory?.courses?.length || 0
        });

        // Get courses that match the criteria
        console.log('Searching for courses with IDs:', selectedCategory.courses);
        const courses = await Course.find({
            _id: { $in: selectedCategory.courses || [] },
            status: "Published",
            isVisible: true
        })
        .populate([
            {
                path: "instructor",
                select: "firstName lastName email"
            },
            {
                path: "ratingAndReviews"
            },
            {
                path: "category",
                select: "name"
            },
            {
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "timeDuration"
                }
            }
        ])
        .lean();

        console.log('Found matching courses:', courses.length);
        if (courses.length > 0) {
            console.log('Sample course details:', {
                id: courses[0]._id,
                name: courses[0].courseName,
                status: courses[0].status,
                isVisible: courses[0].isVisible,
                instructor: courses[0].instructor?.firstName + ' ' + courses[0].instructor?.lastName
            });
        }

        // Replace the course IDs with the actual course objects
        selectedCategory.courses = courses;

        if (selectedCategory.courses.length === 0) {
            console.log('WARNING: No published/visible courses found for category');
            return res.status(200).json({
                success: true,
                data: {
                    selectedCategory: {
                        ...selectedCategory,
                        courses: []
                    },
                    differentCategory: {
                        _id: null,
                        name: "Other Courses",
                        description: "Explore other available courses",
                        courses: []
                    },
                    mostSellingCourses: []
                },
                message: "No courses found for the selected category.",
            });
        }

        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        }).lean()

        // Get a different category with error handling
        let differentCategory = null;
        let differentCategoryCourses = [];
        
        if (categoriesExceptSelected.length > 0) {
            try {
                const randomIndex = getRandomInt(categoriesExceptSelected.length);
                differentCategory = await Category.findById(
                    categoriesExceptSelected[randomIndex]._id
                ).lean();

                if (differentCategory && differentCategory.courses && differentCategory.courses.length > 0) {
                    // Get courses for different category
                    differentCategoryCourses = await Course.find({
                        _id: { $in: differentCategory.courses },
                        status: "Published",
                        isVisible: true
                    })
                    .populate([
                        {
                            path: "instructor",
                            select: "firstName lastName email"
                        },
                        {
                            path: "ratingAndReviews"
                        },
                        {
                            path: "category",
                            select: "name"
                        },
                        {
                            path: "courseContent",
                            populate: {
                                path: "subSection",
                                select: "timeDuration"
                            }
                        }
                    ])
                    .lean();
                }
            } catch (error) {
                console.error('Error fetching different category:', error);
                differentCategory = null;
                differentCategoryCourses = [];
            }
        }

        // Replace course IDs with actual course objects
        if (differentCategory) {
            differentCategory.courses = differentCategoryCourses;
        } else {
            // Create a fallback empty category
            differentCategory = {
                _id: null,
                name: "Other Courses",
                description: "Explore other available courses",
                courses: []
            };
        }

        // Get all categories
        const allCategories = await Category.find().lean();

        // Get all published and visible courses
        const allCourses = await Course.find({
            _id: { $in: allCategories.flatMap(category => category.courses) },
            status: "Published",
            isVisible: true
        })
        .populate([
            {
                path: "instructor",
                select: "firstName lastName email"
            },
            {
                path: "ratingAndReviews"
            },
            {
                path: "category",
                select: "name"
            },
            {
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "timeDuration"
                }
            }
        ])
        .lean();

        // Create a set of selectedCategory course IDs for filtering
        const selectedCourseIds = new Set(selectedCategory.courses.map(course => course._id.toString()))

        // Filter mostSellingCourses to exclude courses already in selectedCategory
        let mostSellingCourses = allCourses
            .filter(course => !selectedCourseIds.has(course._id.toString()))
            .sort((a, b) => (b.studentsEnrolled?.length || 0) - (a.studentsEnrolled?.length || 0))
            .slice(0, 10)

        // Add courses from differentCategory as additional related courses, excluding duplicates
        const differentCategoryCourseIds = new Set(differentCategory.courses.map(course => course._id.toString()))
        const additionalCourses = differentCategory.courses.filter(course => !selectedCourseIds.has(course._id.toString()))

        // Combine mostSellingCourses and additionalCourses, ensuring no duplicates
        const combinedCoursesMap = new Map()
        mostSellingCourses.forEach(course => combinedCoursesMap.set(course._id.toString(), course))
        additionalCourses.forEach(course => {
            if (!combinedCoursesMap.has(course._id.toString())) {
                combinedCoursesMap.set(course._id.toString(), course)
            }
        })

        mostSellingCourses = Array.from(combinedCoursesMap.values())

        // Calculate average rating and total duration for all courses
        selectedCategory.courses = selectedCategory.courses.map(course => {
            const ratingData = calculateAverageRating(course.ratingAndReviews);
            
            // Calculate total duration
            let totalDurationInSeconds = 0;
            if (course.courseContent) {
                course.courseContent.forEach((content) => {
                    if (content.subSection) {
                        content.subSection.forEach((subSection) => {
                            const timeDurationInSeconds = parseFloat(subSection.timeDuration);
                            if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
                                totalDurationInSeconds += timeDurationInSeconds;
                            }
                        });
                    }
                });
            }
            
            return {
                ...course,
                averageRating: ratingData.averageRating,
                totalRatings: ratingData.totalRatings,
                totalDuration: convertSecondsToDuration(totalDurationInSeconds)
            };
        });

        differentCategory.courses = differentCategory.courses.map(course => {
            const ratingData = calculateAverageRating(course.ratingAndReviews);
            
            // Calculate total duration
            let totalDurationInSeconds = 0;
            if (course.courseContent) {
                course.courseContent.forEach((content) => {
                    if (content.subSection) {
                        content.subSection.forEach((subSection) => {
                            const timeDurationInSeconds = parseFloat(subSection.timeDuration);
                            if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
                                totalDurationInSeconds += timeDurationInSeconds;
                            }
                        });
                    }
                });
            }
            
            return {
                ...course,
                averageRating: ratingData.averageRating,
                totalRatings: ratingData.totalRatings,
                totalDuration: convertSecondsToDuration(totalDurationInSeconds)
            };
        });

        mostSellingCourses = mostSellingCourses.map(course => {
            const ratingData = calculateAverageRating(course.ratingAndReviews);
            
            // Calculate total duration
            let totalDurationInSeconds = 0;
            if (course.courseContent) {
                course.courseContent.forEach((content) => {
                    if (content.subSection) {
                        content.subSection.forEach((subSection) => {
                            const timeDurationInSeconds = parseFloat(subSection.timeDuration);
                            if (!isNaN(timeDurationInSeconds) && timeDurationInSeconds > 0) {
                                totalDurationInSeconds += timeDurationInSeconds;
                            }
                        });
                    }
                });
            }
            
            return {
                ...course,
                averageRating: ratingData.averageRating,
                totalRatings: ratingData.totalRatings,
                totalDuration: convertSecondsToDuration(totalDurationInSeconds)
            };
        });

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
}
