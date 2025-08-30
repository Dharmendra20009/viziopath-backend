const Profile = require('../models/Profile');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Get user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const profile = await Profile.findOne({ user: userId })
    .populate('user', 'name email isVerified createdAt')
    .lean();

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  // Check privacy settings
  const requestingUser = req.user;
  if (profile.preferences?.privacy?.profileVisibility === 'private' && 
      requestingUser.id !== userId) {
    throw new ApiError(403, 'Profile is private');
  }

  // Increment profile views if viewing someone else's profile
  if (requestingUser.id !== userId) {
    await Profile.findOneAndUpdate(
      { user: userId },
      { $inc: { 'stats.profileViews': 1 } }
    );
  }

  return res.json(new ApiResponse(200, { profile }, 'Profile retrieved successfully'));
});

// Get current user's profile
exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id })
    .populate('user', 'name email isVerified createdAt')
    .lean();

  if (!profile) {
    // Create profile if it doesn't exist
    const newProfile = await Profile.create({
      user: req.user.id,
      bio: '',
      location: '',
      website: '',
      company: '',
      jobTitle: '',
      skills: [],
      education: [],
      experience: [],
      social: {},
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      },
      stats: {
        profileViews: 0,
        connections: 0,
        posts: 0
      }
    });

    const populatedProfile = await Profile.findById(newProfile._id)
      .populate('user', 'name email isVerified createdAt')
      .lean();

    return res.json(new ApiResponse(200, { profile: populatedProfile }, 'Profile created and retrieved successfully'));
  }

  return res.json(new ApiResponse(200, { profile }, 'Profile retrieved successfully'));
});

// Update profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const {
    bio,
    location,
    website,
    company,
    jobTitle,
    skills,
    education,
    experience,
    social,
    preferences
  } = req.body;

  const updateData = {};
  
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (website !== undefined) updateData.website = website;
  if (company !== undefined) updateData.company = company;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (skills !== undefined) updateData.skills = skills;
  if (education !== undefined) updateData.education = education;
  if (experience !== undefined) updateData.experience = experience;
  if (social !== undefined) updateData.social = social;
  if (preferences !== undefined) updateData.preferences = preferences;

  const profile = await Profile.findOneAndUpdate(
    { user: req.user.id },
    { $set: updateData },
    { new: true, runValidators: true, upsert: true }
  ).populate('user', 'name email isVerified createdAt');

  return res.json(new ApiResponse(200, { profile }, 'Profile updated successfully'));
});

// Update avatar
exports.updateAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    throw new ApiError(400, 'Avatar URL is required');
  }

  const profile = await Profile.findOneAndUpdate(
    { user: req.user.id },
    { $set: { avatar: avatarUrl } },
    { new: true, runValidators: true, upsert: true }
  ).populate('user', 'name email isVerified createdAt');

  return res.json(new ApiResponse(200, { profile }, 'Avatar updated successfully'));
});

// Search profiles
exports.searchProfiles = asyncHandler(async (req, res) => {
  const { 
    q, 
    skills, 
    location, 
    company, 
    page = 1, 
    limit = 10 
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Build search query
  const searchQuery = {};
  
  if (q) {
    searchQuery.$or = [
      { 'user.name': { $regex: q, $options: 'i' } },
      { bio: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { jobTitle: { $regex: q, $options: 'i' } }
    ];
  }
  
  if (skills) {
    const skillArray = skills.split(',').map(skill => skill.trim());
    searchQuery.skills = { $in: skillArray };
  }
  
  if (location) {
    searchQuery.location = { $regex: location, $options: 'i' };
  }
  
  if (company) {
    searchQuery.company = { $regex: company, $options: 'i' };
  }

  // Only show public profiles
  searchQuery['preferences.privacy.profileVisibility'] = 'public';

  const profiles = await Profile.find(searchQuery)
    .populate('user', 'name email isVerified createdAt')
    .sort({ 'stats.profileViews': -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Profile.countDocuments(searchQuery);

  return res.json(new ApiResponse(200, {
    profiles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Profiles retrieved successfully'));
});

// Get profile suggestions
exports.getProfileSuggestions = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  
  // Get profiles based on current user's skills and location
  const currentProfile = await Profile.findOne({ user: req.user.id });
  
  let suggestionsQuery = { 'preferences.privacy.profileVisibility': 'public' };
  
  if (currentProfile?.skills?.length > 0) {
    suggestionsQuery.skills = { $in: currentProfile.skills };
  }
  
  if (currentProfile?.location) {
    suggestionsQuery.location = { $regex: currentProfile.location, $options: 'i' };
  }
  
  // Exclude current user
  suggestionsQuery.user = { $ne: req.user.id };

  const suggestions = await Profile.find(suggestionsQuery)
    .populate('user', 'name email isVerified createdAt')
    .sort({ 'stats.profileViews': -1 })
    .limit(parseInt(limit))
    .lean();

  return res.json(new ApiResponse(200, { suggestions }, 'Profile suggestions retrieved successfully'));
});

// Delete profile
exports.deleteProfile = asyncHandler(async (req, res) => {
  await Profile.findOneAndDelete({ user: req.user.id });
  
  return res.json(new ApiResponse(200, {}, 'Profile deleted successfully'));
});

