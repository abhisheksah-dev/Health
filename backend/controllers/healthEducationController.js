// ./controllers/healthEducationController.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const HealthEducation = require('../models/HealthEducation');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// Initialize Gemini AI client if the API key is available
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Create new health education content
exports.createContent = catchAsync(async (req, res, next) => {
  const content = await HealthEducation.create({
    ...req.body,
    author: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      content,
    },
  });
});

// Get all health education content with filtering
exports.getAllContent = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    HealthEducation.find({ status: 'published' }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const content = await features.query.populate('author', 'name');

  res.status(200).json({
    status: 'success',
    results: content.length,
    data: {
      content,
    },
  });
});

// Get single health education content
exports.getContent = catchAsync(async (req, res, next) => {
  const content = await HealthEducation.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'metadata.views': 1 } },
    { new: true }
  ).populate('author', 'name').populate('reviews');

  if (!content || content.status !== 'published') {
    return next(new AppError('No content found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      content,
    },
  });
});

// Update health education content
exports.updateContent = catchAsync(async (req, res, next) => {
  const content = await HealthEducation.findById(req.params.id);

  if (!content) {
    return next(new AppError('No content found with that ID', 404));
  }

  if (content.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this content', 403));
  }

  const updatedContent = await HealthEducation.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastUpdated: Date.now(),
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate('author', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      content: updatedContent,
    },
  });
});

// Delete health education content
exports.deleteContent = catchAsync(async (req, res, next) => {
  const content = await HealthEducation.findById(req.params.id);

  if (!content) {
    return next(new AppError('No content found with that ID', 404));
  }

  if (content.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this content', 403));
  }

  await content.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * NEW: Search for health education content using Gemini AI for semantic understanding.
 */
exports.searchContent = catchAsync(async (req, res, next) => {
  if (!genAI) {
    return next(new AppError('AI search is not configured on the server.', 500));
  }

  const { search } = req.query;
  if (!search) {
    return next(new AppError('Please provide a search query.', 400));
  }

  // 1. Fetch a corpus of available articles (titles, summaries, tags, and IDs)
  const articles = await HealthEducation.find({ status: 'published' })
    .select('title summary tags')
    .lean();

  if (articles.length === 0) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: { content: [] },
    });
  }

  // 2. Craft the prompt for Gemini AI
  const prompt = `You are a search engine for a health education library. Based on the user's query, find the most relevant articles from the provided list.

User Query: "${search}"

Available Articles (JSON):
${JSON.stringify(
  articles.map((a) => ({
    _id: a._id,
    title: a.title,
    summary: a.summary,
    tags: a.tags,
  }))
)}

Return ONLY a JSON array of the string _id's of the top 5 most relevant articles, ordered from most to least relevant. Example: ["60d5ecb5...", "60d5ecb6...", ...]. Do not include any other text or explanations.`;

  // 3. Call the Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  let relevantIds;
  try {
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('No JSON array found in the AI response.');
    }
    relevantIds = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(relevantIds) || !relevantIds.every(id => typeof id === 'string')) {
      throw new Error('Gemini did not return a valid array of strings.');
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    // Fallback to basic text search if AI fails
    console.log('Falling back to basic text search...');
    const fallbackResults = await HealthEducation.find(
      { $text: { $search: search }, status: 'published' },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(10).populate('author', 'name');

    return res.status(200).json({
      status: 'success',
      message: 'AI search failed, showing basic results.',
      results: fallbackResults.length,
      data: { content: fallbackResults }
    });
  }

  if (relevantIds.length === 0) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: { content: [] },
    });
  }

  // 4. Fetch the full documents from the database
  const searchResults = await HealthEducation.find({
    _id: { $in: relevantIds },
  }).populate('author', 'name');

  // 5. Order the results based on Gemini's relevance ranking
  const orderedResults = relevantIds
    .map((id) => searchResults.find((result) => result._id.toString() === id))
    .filter(Boolean); // Filter out any nulls if an ID wasn't found

  res.status(200).json({
    status: 'success',
    results: orderedResults.length,
    data: {
      content: orderedResults,
    },
  });
});

// Get content statistics
exports.getContentStats = catchAsync(async (req, res, next) => {
  const stats = await HealthEducation.aggregate([
    {
      $match: { status: 'published' },
    },
    {
      $group: {
        _id: '$category',
        totalContent: { $sum: 1 },
        totalViews: { $sum: '$metadata.views' },
        averageRating: { $avg: '$metadata.averageRating' },
        languages: { $addToSet: '$language' },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// Get trending content
exports.getTrendingContent = catchAsync(async (req, res, next) => {
  const { limit = 5, timeFrame = '7d' } = req.query;

  const timeFrameMs =
    {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeFrame] || 7 * 24 * 60 * 60 * 1000;

  const trendingContent = await HealthEducation.find({
    status: 'published',
    createdAt: { $gte: new Date(Date.now() - timeFrameMs) },
  })
    .sort({ 'metadata.views': -1, 'metadata.averageRating': -1 })
    .limit(parseInt(limit))
    .populate('author', 'name');

  res.status(200).json({
    status: 'success',
    results: trendingContent.length,
    data: {
      content: trendingContent,
    },
  });
});