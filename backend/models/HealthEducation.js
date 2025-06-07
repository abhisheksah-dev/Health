const mongoose = require('mongoose');

/**
 * Health Education Content Model
 * 
 * Represents educational health content in the system with various media types
 * and comprehensive metadata for search and filtering.
 */
const healthEducationSchema = new mongoose.Schema({
  // Core Content Fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['article', 'video', 'infographic', 'faq', 'guide'],
    required: [true, 'Content type is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [100, 'Content should be at least 100 characters']
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [250, 'Summary cannot exceed 250 characters']
  },

  // Ownership and Categorization
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    index: true
  },
  subcategories: [{
    type: String,
    index: true
  }],
  tags: [{
    type: String,
    index: true
  }],

  // Media Assets
  media: {
    images: [{
      url: { type: String, required: true },
      caption: String,
      alt: String
    }],
    videos: [{
      url: { type: String, required: true },
      title: String,
      duration: Number // in seconds
    }],
    documents: [{
      url: { type: String, required: true },
      title: String,
      type: String // pdf, docx, etc.
    }]
  },

  // Localization
  language: {
    type: String,
    required: true,
    default: 'en',
    index: true
  },
  translations: [{
    language: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    summary: { type: String, required: true }
  }],

  // Audience Targeting
  targetAudience: {
    ageRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    gender: [{
      type: String,
      enum: ['male', 'female', 'other']
    }],
    healthConditions: [String]
  },

  // Content Complexity
  readingLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    default: 'intermediate'
  },

  // Publication Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },

  // Engagement Metrics
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },

  // Relationships
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  relatedContent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthEducation'
  }],

  // Timestamps
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ======================
// INDEXING STRATEGY
// ======================

// 1. Compound Text Index for full-text search
healthEducationSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  'tags': 'text' // Properly indexes each array element
}, {
  weights: {
    title: 10,
    tags: 5,
    summary: 3,
    content: 1
  },
  name: 'content_search_index'
});

// 2. Performance Indexes
healthEducationSchema.index({ category: 1, status: 1 }); // Common filter combo
healthEducationSchema.index({ 'metadata.views': -1 }); // Popular content
healthEducationSchema.index({ 'metadata.averageRating': -1 }); // Top-rated
healthEducationSchema.index({ createdAt: -1 }); // Newest first
healthEducationSchema.index({ author: 1, status: 1 }); // User's content

// ======================
// VIRTUALS & METHODS
// ======================

// Virtual for formatted last updated date
healthEducationSchema.virtual('lastUpdatedFormatted').get(function() {
  return this.lastUpdated.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Method to increment views
healthEducationSchema.methods.incrementViews = async function() {
  this.metadata.views += 1;
  await this.save();
};

// Static method for text search
healthEducationSchema.statics.searchContent = async function(query, options = {}) {
  const { limit = 10, page = 1, language = 'en' } = options;
  
  return this.find(
    { 
      $text: { $search: query },
      language,
      status: 'published'
    },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .skip((page - 1) * limit)
  .limit(limit)
  .populate('author', 'name role');
};

// ======================
// HOOKS
// ======================

// Update lastUpdated timestamp before saving
healthEducationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Auto-create slug before validation
healthEducationSchema.pre('validate', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('HealthEducation', healthEducationSchema);