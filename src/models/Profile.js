const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 200,
    default: ''
  },
  company: {
    type: String,
    maxlength: 100,
    default: ''
  },
  jobTitle: {
    type: String,
    maxlength: 100,
    default: ''
  },
  skills: [{
    type: String,
    maxlength: 50
  }],
  education: [{
    institution: {
      type: String,
      required: true,
      maxlength: 200
    },
    degree: {
      type: String,
      required: true,
      maxlength: 100
    },
    field: {
      type: String,
      maxlength: 100
    },
    startDate: Date,
    endDate: Date,
    description: {
      type: String,
      maxlength: 500
    }
  }],
  experience: [{
    company: {
      type: String,
      required: true,
      maxlength: 200
    },
    position: {
      type: String,
      required: true,
      maxlength: 100
    },
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      maxlength: 1000
    }
  }],
  social: {
    twitter: {
      type: String,
      maxlength: 100
    },
    linkedin: {
      type: String,
      maxlength: 100
    },
    github: {
      type: String,
      maxlength: 100
    },
    facebook: {
      type: String,
      maxlength: 100
    },
    instagram: {
      type: String,
      maxlength: 100
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'connections'],
        default: 'public'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      }
    }
  },
  stats: {
    profileViews: {
      type: Number,
      default: 0
    },
    connections: {
      type: Number,
      default: 0
    },
    posts: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ProfileSchema.index({ user: 1 });
ProfileSchema.index({ 'skills': 1 });
ProfileSchema.index({ 'location': 1 });
ProfileSchema.index({ 'company': 1 });

// Virtual for full name
ProfileSchema.virtual('fullName').get(function() {
  return this.user?.name || '';
});

// Pre-save middleware
ProfileSchema.pre('save', function(next) {
  // Ensure skills are unique
  if (this.skills) {
    this.skills = [...new Set(this.skills)];
  }
  next();
});

module.exports = mongoose.model('Profile', ProfileSchema);

