const Chat = require('../models/Chat');
const User = require('../models/User');
const {catchAsync} = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to get AI response
const getAIResponse = async (message, user) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const userWithHistory = await User.findById(user.id).select('medicalHistory');
        const context = userWithHistory?.medicalHistory ? `
          Here is some context about the user you are assisting:
          - Allergies: ${userWithHistory.medicalHistory.allergies?.map(a => a.name).join(', ') || 'None reported'}
          - Existing Conditions: ${userWithHistory.medicalHistory.conditions?.map(c => c.name).join(', ') || 'None reported'}
        ` : 'The user has not provided any medical history.';

        const prompt = `You are a helpful and cautious medical AI assistant. Your primary goal is to provide safe, general health information. 
        **Crucially, you must always remind the user to consult with a real healthcare professional for any medical advice or diagnosis.**
        
        User Context:
        ${context}
        
        User's Query: "${message}"
        
        Please provide a helpful and safe response.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (err) {
        console.error('Google Generative AI Error:', err);
        return "I'm sorry, but I encountered an issue while processing your request. Please try again later. For any urgent concerns, please contact a healthcare professional.";
    }
};

// Create new chat session
exports.createChat = catchAsync(async (req, res, next) => {
  const { initialMessage } = req.body;

  const chat = await Chat.create({
    userId: req.user.id,
    messages: initialMessage ? [{
      sender: 'user',
      content: initialMessage,
    }] : []
  });

  if (initialMessage) {
    const response = await getAIResponse(initialMessage, req.user);
    chat.messages.push({
      sender: 'assistant',
      content: response,
    });
    await chat.save();
  }

  res.status(201).json({
    status: 'success',
    data: {
      chat
    }
  });
});

// Get chat session
exports.getChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id)
    .populate('userId', 'name email avatar');

  if (!chat) {
    return next(new AppError('No chat found with that ID', 404));
  }

  if (chat.userId.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to view this chat', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      chat
    }
  });
});

// Get all chats for user
exports.getAllChats = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Chat.find({ userId: req.user.id }),
    req.query
  )
    .filter()
    .sort('-lastUpdated')
    .limitFields()
    .paginate();

  const chats = await features.query
    .populate('userId', 'name email avatar');

  res.status(200).json({
    status: 'success',
    results: chats.length,
    data: {
      chats
    }
  });
});

// Send message
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { content } = req.body;
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new AppError('No chat found with that ID', 404));
  }

  if (chat.userId.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to send messages in this chat', 403));
  }

  chat.messages.push({
    sender: 'user',
    content,
  });

  const response = await getAIResponse(content, req.user);
  chat.messages.push({
    sender: 'assistant',
    content: response,
  });
  
  chat.lastUpdated = Date.now();
  await chat.save();

  res.status(200).json({
    status: 'success',
    data: {
      chat
    }
  });
});

// Delete chat
exports.deleteChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return next(new AppError('No chat found with that ID', 404));
  }

  if (chat.userId.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to delete this chat', 403));
  }

  await chat.deleteOne();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get chat statistics
exports.getChatStats = catchAsync(async (req, res, next) => {
  const stats = await Chat.aggregate([
    {
      $match: {
        userId: req.user._id
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalMessages: { $sum: { $size: '$messages' } }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});